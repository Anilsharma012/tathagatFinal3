# OTP SMS Delivery Troubleshooting & Implementation Guide

## 1. Root Cause Analysis
The primary reason for non-delivery in DLT-regulated environments (like India) is a **Template Mismatch**.
- **DLT Scrubbing**: Every SMS sent is matched against your registered templates. Even a missing full stop or extra space causes failure.
- **Mandatory IDs**: `dlt_entity_id` and `dlt_template_id` are required for every request.
- **Variable Constraints**: `{#var#}` is the standard placeholder. Each `{#var#}` has a 30-character limit.
- **Sender ID (Header)**: Must match exactly what is approved on the DLT portal (e.g., `TATHGT`).

## 2. Corrected API Payload
Based on your InstaAlerts curl example, here is the working JSON structure:

```json
{
  "ver": "1.0",
  "key": "YOUR_KARIX_API_KEY",
  "encrpt": "0",
  "messages": [{
    "dest": ["919911003818"],
    "text": "Dear User, use 123456 as your sign up otp for mytathagat.com. OTP is confidential and valid for 10 mins.",
    "send": "TATHGT",
    "dlt_entity_id": "1101538550000021740",
    "dlt_template_id": "1107170349275465220",
    "type": "PM",
    "dcs": "0",
    "udhi_inc": "0",
    "dlr_req": "1",
    "app_country": "1",
    "cust_ref": "unique_transaction_id"
  }]
}
```

## 3. Node.js (Express) Implementation
I have updated `backend1/utils/SendOtp.js` with the correct logic. Below is a standalone example:

```javascript
const axios = require('axios');

async function sendOTP(phone, otp, name = "User") {
    const payload = {
        ver: "1.0",
        key: process.env.KARIX_API_KEY,
        encrpt: "0",
        messages: [{
            dest: [phone.startsWith('91') ? phone : `91${phone}`],
            // Ensure this text EXACTLY matches your DLT approved template
            text: `Dear ${name}, use ${otp} as your sign up otp for mytathagat.com. OTP is confidential and valid for 10 mins.`,
            send: process.env.KARIX_SENDER_ID || "TATHGT",
            dlt_entity_id: "1101538550000021740",
            dlt_template_id: "1107170349275465220",
            type: "PM",
            dlr_req: "1"
        }]
    };

    try {
        const response = await axios.post('https://japi.instaalerts.zone/httpapi/JsonReceiver', payload);
        console.log("Gateway Response:", response.data);
        
        // Success check: code 200 or presence of ackid
        if (response.data.status?.code === "200" || response.data.ackid) {
            return { success: true, ackid: response.data.ackid };
        }
        return { success: false, error: response.data };
    } catch (error) {
        console.error("SMS Error:", error.response?.data || error.message);
        throw error;
    }
}
```

## 4. How to Confirm Delivery (DLR)
- **Response Code**: A `200` response from the API only means the gateway accepted the request. It does **not** mean the SMS reached the handset.
- **ACKID**: The gateway returns an `ackid`. You can use this ID to poll for the Delivery Report (DLR) or set up a Webhook URL in the Karix dashboard to receive real-time updates.
- **DLR Statuses**:
    - `DELIVRD`: Successfully reached handset.
    - `UNDELIV`: Failed (DND, switched off, out of range).
    - `REJECTD`: Failed DLT scrubbing or invalid sender ID.

## 5. Debugging Checklist
- [ ] **Exact Content**: Copy the template text directly from the DLT portal and use `${var}` in JS to replace only the `{#var#}` parts.
- [ ] **Phone Format**: Ensure the number has the `91` prefix (no `+`).
- [ ] **Balance**: Check if your SMS wallet has sufficient credits for the "PM" route.
- [ ] **DND**: Test with a non-DND number first.
- [ ] **Karix Portal Logs**: Log into `instaalerts.zone` and check "Outbound Logs" to see why specific messages were rejected.
