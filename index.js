addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
  });
  
  async function handleRequest(request) {
    if (request.method === 'POST' && request.url.includes('/payment')) {
      return await initiatePayment(request);
    } else if (request.method === 'GET' && request.url.includes('/verify')) {
      return await verifyPayment(request);
    } else if (request.method === 'GET' && request.url.includes('/inquire')) {
      return await inquireTransaction(request);
    } else {
      return new Response('Not Found', { status: 404 });
    }
  }
  
  async function initiatePayment(request) {
    const { amount, description, callback_url, mobile, email, cardPan } = await request.json();
  
    const zarinpalApiUrl = 'https://next.zarinpal.com/api/v4/graphql';
    const accessToken = '34cb37f4-920c-49da-bfa0-229a91ed98bd'; // Replace with your actual Zarinpal access token
  
    const paymentQuery = `
      mutation {
        paymentRequest(
          amount: ${amount}, 
          description: "${description}", 
          callback_url: "${callback_url}", 
          mobile: "${mobile}", 
          email: "${email}", 
          cardPan: ${JSON.stringify(cardPan)}
        ) {
          authority
          paymentUrl
        }
      }
    `;
  
    const response = await fetch(zarinpalApiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: paymentQuery })
    });
  
    const data = await response.json();
    
    if (data.data.paymentRequest) {
      const paymentUrl = data.data.paymentRequest.paymentUrl;
      return Response.redirect(paymentUrl, 302);  // Redirect user to the payment URL
    } else {
      return new Response('Error initiating payment', { status: 400 });
    }
  }
  
  async function verifyPayment(request) {
    const urlParams = new URL(request.url).searchParams;
    const authority = urlParams.get('authority');
    const status = urlParams.get('status');
    
    if (status === 'OK') {
      const amount = await getAmountFromDatabase(authority); // Implement this function to get the amount from DB
      const zarinpalApiUrl = 'https://next.zarinpal.com/api/v4/graphql';
      const accessToken = '34cb37f4-920c-49da-bfa0-229a91ed98bd'; // Replace with your actual Zarinpal access token
      
      const verifyQuery = `
        mutation {
          paymentVerification(
            amount: ${amount}, 
            authority: "${authority}"
          ) {
            ref_id
            card_pan
            fee
          }
        }
      `;
      
      const response = await fetch(zarinpalApiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: verifyQuery })
      });
  
      const data = await response.json();
  
      if (data.data.paymentVerification) {
        const { ref_id, card_pan, fee } = data.data.paymentVerification;
        return new Response(`Payment Verified! Reference ID: ${ref_id}, Card PAN: ${card_pan}, Fee: ${fee}`, { status: 200 });
      } else {
        return new Response('Payment Verification Failed', { status: 400 });
      }
    } else {
      return new Response('Transaction was cancelled or failed.', { status: 400 });
    }
  }
  
  async function inquireTransaction(request) {
    const urlParams = new URL(request.url).searchParams;
    const authority = urlParams.get('authority');
    
    const zarinpalApiUrl = 'https://next.zarinpal.com/api/v4/graphql';
    const accessToken = '34cb37f4-920c-49da-bfa0-229a91ed98bd'; // Replace with your actual Zarinpal access token
    
    const inquiryQuery = `
      query {
        transactionInquiry(
          authority: "${authority}"
        ) {
          code
          message
          status
        }
      }
    `;
    
    const response = await fetch(zarinpalApiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: inquiryQuery })
    });
  
    const data = await response.json();
  
    if (data.data.transactionInquiry) {
      const { code, message, status } = data.data.transactionInquiry;
      return new Response(`Status: ${status}, Message: ${message}`, { status: code === 100 ? 200 : 400 });
    } else {
      return new Response('Transaction Inquiry Failed', { status: 400 });
    }
  }
  