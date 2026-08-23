/**
 * TESTING GUIDE — AUTH PHASE 3 (BIMA UNGGUL)
 * 
 * Complete workflow: Register → Approve → Login → Protected Endpoint → Refresh → Logout
 * 
 * All endpoints are available at: http://localhost:3000/api
 * 
 * Reference: PRD Section 13 (API Integration Surface)
 */

// ============================================================================
// STEP 1: REGISTER OPERATOR (POST /api/auth/register)
// ============================================================================

/**
 * Request: Register new operator with madrasah data
 * 
 * curl -X POST http://localhost:3000/api/auth/register \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "nip": "19800101202412001",
 *     "name": "Kepala Sekolah MI Negeri Bangil",
 *     "email": "kepala@mi-bangil.sch.id",
 *     "password": "SecurePass123",
 *     "madrasahData": {
 *       "nama": "MI Negeri Bangil",
 *       "jenjang": "MI",
 *       "statusKepemilikan": "Negeri",
 *       "alamat": "Jl. Sudirman No. 1, Bangil, Pasuruan",
 *       "jumlahSiswa": 450
 *     }
 *   }'
 * 
 * Expected Response (201 Created):
 * {
 *   "status": "menunggu_persetujuan",
 *   "message": "Pendaftaran berhasil. Menunggu persetujuan admin.",
 *   "user": {
 *     "id": 1,
 *     "nip": "19800101202412001",
 *     "name": "Kepala Sekolah MI Negeri Bangil"
 *   }
 * }
 * 
 * Validation examples:
 * - Missing fields: 400 Bad Request
 * - Duplicate NIP: 400 Bad Request (NIP sudah terdaftar)
 * - Weak password (< 8 char): 400 Bad Request
 * - Invalid jenjang: 400 Bad Request (harus MI/MTs/MA)
 * - Invalid statusKepemilikan: 400 Bad Request (harus Negeri/Swasta)
 * - Invalid jumlahSiswa (not positive number): 400 Bad Request
 */

// ============================================================================
// STEP 2: ADMIN APPROVE USER & CREATE MADRASAH (POST /api/admin/akun/:id/approve)
// ============================================================================

/**
 * Request: Admin approve user (requires admin JWT token)
 * 
 * FIRST: Get admin access token by logging in as admin
 * curl -X POST http://localhost:3000/api/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "nip": "19700101199203001",
 *     "password": "AdminPass123"
 *   }' \
 *   -c cookies.txt
 * 
 * Response:
 * {
 *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": 2,
 *     "nip": "19700101199203001",
 *     "name": "Admin Kemenag",
 *     "role": "admin",
 *     "madrasahId": null
 *   }
 * }
 * 
 * THEN: Approve operator (user id=1)
 * curl -X POST http://localhost:3000/api/admin/akun/1/approve \
 *   -H "Content-Type: application/json" \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
 *   -d '{
 *     "madrasahData": {
 *       "nama": "MI Negeri Bangil",
 *       "jenjang": "MI",
 *       "statusKepemilikan": "Negeri",
 *       "alamat": "Jl. Sudirman No. 1, Bangil, Pasuruan",
 *       "jumlahSiswa": 450
 *     }
 *   }'
 * 
 * Expected Response (200 OK):
 * {
 *   "message": "User berhasil disetujui",
 *   "user": {
 *     "id": 1,
 *     "nip": "19800101202412001",
 *     "name": "Kepala Sekolah MI Negeri Bangil",
 *     "role": "operator",
 *     "status": "aktif",
 *     "madrasahId": 1,
 *     "createdAt": "2026-08-21T13:00:00.000Z"
 *   },
 *   "madrasah": {
 *     "id": 1,
 *     "nomorMadrasah": "BMU-000001",
 *     "namaMadrasah": "MI Negeri Bangil",
 *     "jenjang": "MI",
 *     "statusKepemilikan": "Negeri",
 *     "jumlahSiswa": 450,
 *     "alamat": "Jl. Sudirman No. 1, Bangil, Pasuruan",
 *     "slug": "mi-negeri-bangil",
 *     "kelompok": "MI Negeri",
 *     "createdAt": "2026-08-21T13:00:00.000Z",
 *     "updatedAt": "2026-08-21T13:00:00.000Z"
 *   }
 * }
 * 
 * Error cases:
 * - User not found: 404 Not Found
 * - User status != "menunggu": 400 Bad Request
 * - Missing admin role: 403 Forbidden
 * - Invalid JWT token: 401 Unauthorized
 */

// ============================================================================
// STEP 3: LOGIN OPERATOR (POST /api/auth/login)
// ============================================================================

/**
 * Request: Login with NIP + password
 * 
 * curl -X POST http://localhost:3000/api/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "nip": "19800101202412001",
 *     "password": "SecurePass123"
 *   }' \
 *   -c cookies.txt
 * 
 * Expected Response (200 OK):
 * {
 *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJvcGVyYXRvciIsIm1hZHJhc2FoSWQiOjEsImlhdCI6MTcyNDI1MTIwMCwiZXhwIjoxNzI0MjUxOTAwfQ...",
 *   "user": {
 *     "id": 1,
 *     "nip": "19800101202412001",
 *     "name": "Kepala Sekolah MI Negeri Bangil",
 *     "role": "operator",
 *     "madrasahId": 1
 *   }
 * }
 * 
 * Cookie set: refreshToken (httpOnly, secure, sameSite: strict)
 * 
 * Error cases:
 * - Invalid NIP or password: 401 Unauthorized
 * - User status != "aktif": 401 Unauthorized (not approved yet)
 * - Missing credentials: 400 Bad Request
 */

// ============================================================================
// STEP 4: ACCESS PROTECTED ENDPOINT (with Bearer token)
// ============================================================================

/**
 * Request: Access protected endpoint using access token
 * 
 * Example: GET /api/operator/indikator (protected, requires operator role)
 * 
 * curl -X GET http://localhost:3000/api/operator/indikator \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * 
 * Expected Response (200 OK):
 * [...operator data...]
 * 
 * Error cases:
 * - Missing Authorization header: 401 Unauthorized
 * - Invalid token: 401 Unauthorized
 * - Expired token: 401 Unauthorized (Token sudah kadaluarsa)
 * - Wrong role: 403 Forbidden
 */

// ============================================================================
// STEP 5: REFRESH TOKEN (POST /api/auth/refresh)
// ============================================================================

/**
 * Request: Refresh access token using refresh token from cookie
 * 
 * curl -X POST http://localhost:3000/api/auth/refresh \
 *   -b cookies.txt
 * 
 * Expected Response (200 OK):
 * {
 *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJvcGVyYXRvciIsIm1hZHJhc2FoSWQiOjEsImlhdCI6MTcyNDI1MjEwMCwiZXhwIjoxNzI0MjUyOTAwfQ..."
 * }
 * 
 * Error cases:
 * - Missing refresh token: 401 Unauthorized
 * - Expired refresh token: 401 Unauthorized (Refresh token sudah kadaluarsa)
 * - Invalid refresh token: 401 Unauthorized
 * - User not found or inactive: 401 Unauthorized
 */

// ============================================================================
// STEP 6: LOGOUT (POST /api/auth/logout)
// ============================================================================

/**
 * Request: Logout and clear refresh token cookie
 * 
 * curl -X POST http://localhost:3000/api/auth/logout \
 *   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
 *   -b cookies.txt
 * 
 * Expected Response (200 OK):
 * {
 *   "success": true,
 *   "message": "Logout berhasil"
 * }
 * 
 * Cookie cleared: refreshToken (removed)
 * 
 * Error cases:
 * - Missing Authorization header: 401 Unauthorized
 * - Invalid token: 401 Unauthorized
 */

// ============================================================================
// COMPLETE POSTMAN COLLECTION (import ke Postman)
// ============================================================================

/**
{
  "info": {
    "name": "BIMA UNGGUL Auth Phase 3",
    "description": "Complete auth workflow testing",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{accessToken}}",
        "type": "string"
      }
    ]
  },
  "item": [
    {
      "name": "1. Register Operator",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"nip\": \"19800101202412001\",\n  \"name\": \"Kepala Sekolah MI Negeri Bangil\",\n  \"email\": \"kepala@mi-bangil.sch.id\",\n  \"password\": \"SecurePass123\",\n  \"madrasahData\": {\n    \"nama\": \"MI Negeri Bangil\",\n    \"jenjang\": \"MI\",\n    \"statusKepemilikan\": \"Negeri\",\n    \"alamat\": \"Jl. Sudirman No. 1, Bangil, Pasuruan\",\n    \"jumlahSiswa\": 450\n  }\n}"
        },
        "url": "http://localhost:3000/api/auth/register"
      }
    },
    {
      "name": "2. Admin Login (for approval)",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"nip\": \"19700101199203001\",\n  \"password\": \"AdminPass123\"\n}"
        },
        "url": "http://localhost:3000/api/auth/login"
      }
    },
    {
      "name": "3. Approve User",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Content-Type", "value": "application/json" },
          { "key": "Authorization", "value": "Bearer {{adminAccessToken}}" }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"madrasahData\": {\n    \"nama\": \"MI Negeri Bangil\",\n    \"jenjang\": \"MI\",\n    \"statusKepemilikan\": \"Negeri\",\n    \"alamat\": \"Jl. Sudirman No. 1, Bangil, Pasuruan\",\n    \"jumlahSiswa\": 450\n  }\n}"
        },
        "url": "http://localhost:3000/api/admin/akun/1/approve"
      }
    },
    {
      "name": "4. Operator Login",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"nip\": \"19800101202412001\",\n  \"password\": \"SecurePass123\"\n}"
        },
        "url": "http://localhost:3000/api/auth/login"
      }
    },
    {
      "name": "5. Refresh Token",
      "request": {
        "method": "POST",
        "header": [],
        "url": "http://localhost:3000/api/auth/refresh"
      }
    },
    {
      "name": "6. Logout",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Authorization", "value": "Bearer {{accessToken}}" }
        ],
        "url": "http://localhost:3000/api/auth/logout"
      }
    }
  ]
}

*/

// ============================================================================
// IMPORTANT SETUP FOR TESTING
// ============================================================================

/**
 * BEFORE TESTING, ensure:
 * 
 * 1. Backend is running:
 *    $ npm run dev (or node src/server.js)
 *    Check: http://localhost:3000/api/auth/login (should give 400, not connection error)
 * 
 * 2. Database is configured in .env:
 *    DATABASE_URL="mysql://user:password@localhost:3306/bima_unggul"
 * 
 * 3. Prisma migrations are applied:
 *    $ npx prisma migrate dev
 * 
 * 4. JWT secrets are set in .env:
 *    JWT_SECRET="your-super-secret-key-min-32-chars-change-in-prod"
 *    REFRESH_SECRET="your-refresh-secret-key-min-32-chars-change-in-prod"
 * 
 * 5. Seed database with admin user (if needed):
 *    Run migration script yang include creating default admin dengan:
 *    - nip: "19700101199203001"
 *    - password: "AdminPass123" (hashed)
 *    - role: "admin"
 *    - status: "aktif"
 * 
 * 6. For testing with curl, install curl if not available:
 *    Windows: Already included in modern Windows builds
 *    Or use PowerShell: Invoke-WebRequest (see examples below)
 */

// ============================================================================
// ALTERNATIVE: POWERSHELL EXAMPLES (Windows)
// ============================================================================

/**
 * PowerShell Example 1: Register
 * 
 * $body = @{
 *     nip = "19800101202412001"
 *     name = "Kepala Sekolah MI Negeri Bangil"
 *     email = "kepala@mi-bangil.sch.id"
 *     password = "SecurePass123"
 *     madrasahData = @{
 *         nama = "MI Negeri Bangil"
 *         jenjang = "MI"
 *         statusKepemilikan = "Negeri"
 *         alamat = "Jl. Sudirman No. 1, Bangil, Pasuruan"
 *         jumlahSiswa = 450
 *     }
 * } | ConvertTo-Json
 * 
 * $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" `
 *     -Method POST `
 *     -Headers @{"Content-Type"="application/json"} `
 *     -Body $body
 * 
 * $response.Content | ConvertFrom-Json
 */

/**
 * PowerShell Example 2: Login
 * 
 * $body = @{
 *     nip = "19800101202412001"
 *     password = "SecurePass123"
 * } | ConvertTo-Json
 * 
 * $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
 *     -Method POST `
 *     -Headers @{"Content-Type"="application/json"} `
 *     -Body $body `
 *     -SessionVariable session
 * 
 * $result = $response.Content | ConvertFrom-Json
 * $accessToken = $result.accessToken
 * 
 * # Use token for protected requests:
 * Invoke-WebRequest -Uri "http://localhost:3000/api/operator/indikator" `
 *     -Method GET `
 *     -Headers @{"Authorization"="Bearer $accessToken"} `
 *     -WebSession $session
 */

export const TESTING_GUIDE = {
  steps: [
    '1. Register operator with madrasah data',
    '2. Admin approves user → Madrasah created with BMU auto-generated',
    '3. Login with approved credentials',
    '4. Use access token to access protected endpoints',
    '5. Refresh token when access token expires (15 min)',
    '6. Logout to clear refresh token',
  ],
  baseUrl: 'http://localhost:3000/api',
  credentials: {
    admin: {
      nip: '19700101199203001',
      password: 'AdminPass123',
    },
    operator: {
      nip: '19800101202412001',
      password: 'SecurePass123',
    },
  },
};
