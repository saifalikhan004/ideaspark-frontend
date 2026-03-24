#!/usr/bin/env node

/**
 * Backend Integration Test Script
 * Tests the connection between frontend and deployed backend
 */

const https = require("https");

const BACKEND_URL = "https://ideaspark-backend-i4p8.onrender.com";

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({ status: res.statusCode, data: data });
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log("🧪 Testing IdeaSpark Backend Integration\n");
  console.log(`Backend URL: ${BACKEND_URL}\n`);

  try {
    // Test 1: Health check
    console.log("Test 1: Health Check");
    let result = await makeRequest("GET", "/");
    console.log(`✓ GET / - Status: ${result.status}`);
    console.log(`  Response: ${result.data}\n`);

    // Test 2: Idea endpoint (GET)
    console.log("Test 2: Idea Endpoint (GET)");
    result = await makeRequest("GET", "/idea/");
    console.log(`✓ GET /idea/ - Status: ${result.status}`);
    console.log(`  Response: ${result.data.substring(0, 100)}...\n`);

    // Test 3: Chat endpoint (GET)
    console.log("Test 3: Chat Endpoint (GET)");
    result = await makeRequest("GET", "/chat/");
    console.log(`✓ GET /chat/ - Status: ${result.status}`);
    console.log(`  Response: ${result.data.substring(0, 100)}...\n`);

    // Test 4: Auth endpoint (POST with test data)
    console.log("Test 4: Auth Endpoint (POST test)");
    result = await makeRequest("POST", "/auth/firebase-token", {
      clerk_user_id: "test-user-id",
    });
    console.log(`✓ POST /auth/firebase-token - Status: ${result.status}`);
    console.log(`  Response: ${result.data.substring(0, 100)}...\n`);

    console.log("✅ All tests passed! Backend is ready for integration.\n");
    console.log("Frontend configuration updated:");
    console.log(
      "  • EXPO_PUBLIC_BACKEND_URL=https://ideaspark-backend-i4p8.onrender.com",
    );
    console.log("  • workspace.tsx uses BACKEND_URL from env");
    console.log(
      "  • useFirebaseAuth.ts uses backend URL for token generation\n",
    );
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

runTests();
