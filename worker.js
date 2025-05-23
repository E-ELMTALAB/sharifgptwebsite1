(() => {
  var __defProp = Object.defineProperty;
  var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

  // worker.js
  var MERCHANT_ID = "34cb37f4-920c-49da-bfa0-229a91ed98bd";
  var SANDBOX = false;
  var BASE_URL = SANDBOX ? "https://sandbox.zarinpal.com/pg/v4/payment/" : "https://payment.zarinpal.com/pg/v4/payment/";
  var PAYMENT_GATEWAY = SANDBOX ? "https://sandbox.zarinpal.com/pg/StartPay/" : "https://www.zarinpal.com/pg/StartPay/";
  var API = {
    PR: "request.json",
    PV: "verify.json",
    UT: "unVerified.json"
  };
  var corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true"
  };
  async function makeRequest(endpoint, data) {
    try {
      console.log("=== Making API Request ===");
      console.log("URL:", BASE_URL + endpoint);
      console.log("Request Data:", JSON.stringify(data, null, 2));
      console.log("Request Headers:", {
        "Content-Type": "application/json",
        "Accept": "application/json"
      });
      const response = await fetch(BASE_URL + endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(data)
      });
      console.log("=== API Response ===");
      console.log("Status:", response.status);
      console.log("Status Text:", response.statusText);
      console.log("Headers:", Object.fromEntries(response.headers.entries()));
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error Response Body:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      const contentType = response.headers.get("content-type");
      console.log("Content-Type:", contentType);
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON Response:", text);
        throw new Error("Expected JSON response but got " + contentType);
      }
      const result = await response.json();
      console.log("Response Body:", JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error("=== API Request Error ===");
      console.error("Error:", error);
      console.error("Stack:", error.stack);
      throw error;
    }
  }
  __name(makeRequest, "makeRequest");
  async function handlePaymentRequest(request) {
    console.log("=== Payment Request Handler ===");
    try {
      console.log("Request Headers:", Object.fromEntries(request.headers.entries()));
      const body = await request.json();
      console.log("Request Body:", JSON.stringify(body, null, 2));
      const { amount, callbackUrl, description, email, mobile } = body;
      if (!amount || !callbackUrl) {
        console.error("Missing required fields:", { amount, callbackUrl });
        return new Response(JSON.stringify({
          success: false,
          message: "Missing required fields: amount and callbackUrl are required"
        }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      const params = {
        merchant_id: MERCHANT_ID,
        amount,
        callback_url: callbackUrl,
        description: description || "Payment",
        metadata: { email, mobile }
      };
      console.log("Payment Request Params:", JSON.stringify(params, null, 2));
      const response = await makeRequest(API.PR, params);
      console.log("Payment Response:", JSON.stringify(response, null, 2));
      if (response.data.code === 100) {
        const successResponse = {
          success: true,
          url: PAYMENT_GATEWAY + response.data.authority
        };
        console.log("Success Response:", JSON.stringify(successResponse, null, 2));
        return new Response(JSON.stringify(successResponse), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      } else {
        const errorResponse = {
          success: false,
          message: "Payment request failed",
          error: response.data
        };
        console.log("Error Response:", JSON.stringify(errorResponse, null, 2));
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
    } catch (error) {
      console.error("=== Payment Request Error ===");
      console.error("Error:", error);
      console.error("Stack:", error.stack);
      return new Response(JSON.stringify({
        success: false,
        message: "Server error",
        error: error.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  }
  __name(handlePaymentRequest, "handlePaymentRequest");
  async function handlePaymentVerification(request) {
    console.log("=== Payment Verification Handler ===");
    try {
      console.log("Request Headers:", Object.fromEntries(request.headers.entries()));
      const body = await request.json();
      console.log("Request Body:", JSON.stringify(body, null, 2));
      const { amount, authority } = body;
      if (!amount || !authority) {
        console.error("Missing required fields:", { amount, authority });
        return new Response(JSON.stringify({
          success: false,
          message: "Missing required fields: amount and authority are required"
        }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      const params = {
        merchant_id: MERCHANT_ID,
        amount,
        authority
      };
      console.log("Verification Params:", JSON.stringify(params, null, 2));
      const response = await makeRequest(API.PV, params);
      console.log("Verification Response:", JSON.stringify(response, null, 2));
      if (response.data.code === 100) {
        const successResponse = {
          success: true,
          refId: response.data.ref_id
        };
        console.log("Success Response:", JSON.stringify(successResponse, null, 2));
        return new Response(JSON.stringify(successResponse), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      } else {
        const errorResponse = {
          success: false,
          message: "Payment verification failed",
          error: response.data
        };
        console.log("Error Response:", JSON.stringify(errorResponse, null, 2));
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
    } catch (error) {
      console.error("=== Verification Error ===");
      console.error("Error:", error);
      console.error("Stack:", error.stack);
      return new Response(JSON.stringify({
        success: false,
        message: "Server error",
        error: error.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  }
  __name(handlePaymentVerification, "handlePaymentVerification");
  addEventListener("fetch", (event) => {
    console.log("=== Worker Fetch Event ===");
    console.log("Request URL:", event.request.url);
    console.log("Request Method:", event.request.method);
    console.log("Request Headers:", Object.fromEntries(event.request.headers.entries()));
    event.respondWith(handleRequest(event.request));
  });
  async function handleRequest(request) {
    console.log("=== Request Handler ===");
    console.log("URL:", request.url);
    console.log("Method:", request.method);
    console.log("Headers:", Object.fromEntries(request.headers.entries()));
    if (request.method === "OPTIONS") {
      console.log("Handling OPTIONS request");
      return new Response(null, {
        headers: corsHeaders
      });
    }
    const url = new URL(request.url);
    console.log("Path:", url.pathname);
    try {
      let response;
      if (url.pathname === "/api/payment/request" && request.method === "POST") {
        console.log("Handling payment request");
        response = await handlePaymentRequest(request);
      } else if (url.pathname === "/api/payment/verify" && request.method === "POST") {
        console.log("Handling payment verification");
        response = await handlePaymentVerification(request);
      } else {
        console.log("Path not found");
        response = new Response("Not Found", {
          status: 404,
          headers: corsHeaders
        });
      }
      console.log("Response Status:", response.status);
      console.log("Response Headers:", Object.fromEntries(response.headers.entries()));
      return response;
    } catch (error) {
      console.error("=== Request Handler Error ===");
      console.error("Error:", error);
      console.error("Stack:", error.stack);
      return new Response(JSON.stringify({
        success: false,
        message: "Internal server error",
        error: error.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  }
  __name(handleRequest, "handleRequest");
})();
//# sourceMappingURL=worker.js.map
