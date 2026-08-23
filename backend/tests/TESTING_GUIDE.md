# Testing Guide — BIMA UNGGUL

> Dihasilkan otomatis dari tests/TESTING_GUIDE.js (sumber kebenaran tetap file JS tsb).

`json
{
  "steps": [
    "1. Register operator with madrasah data",
    "2. Admin approves user → Madrasah created with BMU auto-generated",
    "3. Login with approved credentials",
    "4. Use access token to access protected endpoints",
    "5. Refresh token when access token expires (15 min)",
    "6. Logout to clear refresh token"
  ],
  "baseUrl": "http://localhost:3000/api",
  "credentials": {
    "admin": {
      "nip": "19700101199203001",
      "password": "AdminPass123"
    },
    "operator": {
      "nip": "19800101202412001",
      "password": "SecurePass123"
    }
  }
}
`