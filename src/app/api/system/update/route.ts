import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const GITHUB_REPO = 'looknamx/storage'
const TARGET_BRANCH = 'master'

// GET: Check version against GitHub API
export async function GET() {
  try {
    // 1. Get current local commit
    let localCommit = ''
    let localCommitShort = ''
    let localCommitDate = ''
    let localCommitMsg = ''
    let localBranch = 'master'

    try {
      const { stdout: hashOut } = await execAsync('git rev-parse HEAD')
      localCommit = hashOut.trim()
      localCommitShort = localCommit.substring(0, 7)

      const { stdout: dateOut } = await execAsync('git log -1 --format=%cd --date=iso')
      localCommitDate = dateOut.trim()

      const { stdout: msgOut } = await execAsync('git log -1 --format=%s')
      localCommitMsg = msgOut.trim()

      const { stdout: branchOut } = await execAsync('git rev-parse --abbrev-ref HEAD')
      localBranch = branchOut.trim() || 'master'
    } catch (e: any) {
      console.warn('Could not read local git info:', e.message)
    }

    // 2. Fetch latest commit from GitHub Public API
    let remoteCommit = ''
    let remoteCommitShort = ''
    let remoteCommitMsg = ''
    let remoteCommitDate = ''
    let remoteAuthor = ''
    let hasUpdate = false
    let checkError: string | null = null

    try {
      const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/commits/${TARGET_BRANCH}`
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'FleetStorage-App',
        },
        next: { revalidate: 60 }, // Cache 60 seconds
      })

      if (response.ok) {
        const data = await response.json()
        remoteCommit = data.sha || ''
        remoteCommitShort = remoteCommit.substring(0, 7)
        remoteCommitMsg = data.commit?.message || ''
        remoteCommitDate = data.commit?.committer?.date || data.commit?.author?.date || ''
        remoteAuthor = data.commit?.author?.name || 'GitHub'

        if (localCommit && remoteCommit && localCommit !== remoteCommit) {
          hasUpdate = true
        }
      } else if (response.status === 403) {
        checkError = 'เกินโควตาการเรียก GitHub API ชั่วคราว (Rate Limit)'
      } else {
        checkError = `GitHub API ตอบกลับสถานะ ${response.status}`
      }
    } catch (apiErr: any) {
      checkError = 'ไม่สามารถเชื่อมต่ออินเทอร์เน็ตหรือ GitHub ได้'
    }

    return NextResponse.json({
      repo: GITHUB_REPO,
      branch: localBranch,
      targetBranch: TARGET_BRANCH,
      current: {
        commit: localCommit,
        short: localCommitShort,
        date: localCommitDate,
        message: localCommitMsg,
      },
      latest: {
        commit: remoteCommit,
        short: remoteCommitShort,
        date: remoteCommitDate,
        message: remoteCommitMsg,
        author: remoteAuthor,
      },
      hasUpdate,
      checkError,
      checkedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('System version check error:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการตรวจสอบเวอร์ชัน' },
      { status: 500 }
    )
  }
}

// POST: Execute git pull origin master and prisma db push
export async function POST() {
  try {
    const logs: string[] = []

    // Step 1: Git fetch & pull
    try {
      const { stdout: pullOut, stderr: pullErr } = await execAsync('git pull origin master')
      logs.push(`[git pull]: ${pullOut.trim()}`)
      if (pullErr) logs.push(`[git notice]: ${pullErr.trim()}`)
    } catch (pullError: any) {
      console.error('Git pull failed:', pullError)
      return NextResponse.json(
        {
          error: `ดึงโค้ดอัปเดตไม่สำเร็จ: ${pullError.message}`,
          logs,
        },
        { status: 500 }
      )
    }

    // Step 2: Prisma db push (safely update schema without losing user database)
    try {
      const { stdout: prismaOut } = await execAsync('npx prisma db push --skip-generate')
      logs.push(`[prisma db push]: ${prismaOut.trim()}`)
    } catch (prismaError: any) {
      logs.push(`[prisma notice]: ${prismaError.message}`)
    }

    // Step 3: Get updated commit
    const { stdout: newCommitOut } = await execAsync('git rev-parse HEAD')
    const newCommit = newCommitOut.trim()

    return NextResponse.json({
      success: true,
      message: 'อัปเดตระบบตามโค้ดล่าสุดบน GitHub สำเร็จเรียบร้อยแล้ว',
      newCommit: newCommit.substring(0, 7),
      logs,
    })
  } catch (error: any) {
    console.error('System update execution error:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการรันการอัปเดต' },
      { status: 500 }
    )
  }
}

