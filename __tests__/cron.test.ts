import { GET } from '../src/app/api/cron/daily-puzzle/route'
import { NextRequest } from 'next/server'

// Mock environment variable
process.env.CRON_SECRET = 'test-secret'

describe('Daily Puzzle Cron', () => {
  it('should require authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/cron/daily-puzzle')
    
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should accept valid authorization header', async () => {
    const request = new NextRequest('http://localhost:3000/api/cron/daily-puzzle', {
      headers: {
        'authorization': 'Bearer test-secret'
      }
    })
    
    const response = await GET(request)
    const data = await response.json()
    
    // Should either succeed or fail gracefully (not auth error)
    expect(response.status).not.toBe(401)
    expect(data).toHaveProperty('success')
    expect(data).toHaveProperty('timestamp')
  })
})