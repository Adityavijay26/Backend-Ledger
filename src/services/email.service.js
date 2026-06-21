const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});



// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Message sent:", info.messageId);
    console.log("Response:", info.response);

  } catch (error) {
    console.error("Error sending email:", error);
  }
};

async function sendRegisterationEmail (userEmail , name){

  console.log("Sending Email to:", userEmail);
  const subject = 'Welcome to Backend Ledger!';
  const text = `Hello ${name},\n\n Thank You for registration at Backend Ledger.
  We're excited to have you on board!\n\n Best regards, \n The Backend Ledger Team`;
  const html = `<p>Hello ${name},</p><p>Thank You for registration at Backend Ledger.
  We're excited to have you on board!</p><p>Best regards, \n The Backend Ledger Team</p>`;

  await sendEmail(userEmail , subject , text , html);
  console.log("Email Function Completed");
}


async function sendTransactionEmail(userEmail , name , amount , toAccount){
  const subject = "Transaction Successful !";
  const text = `Hello ${name},\n\n Your transaction of ${amount} to account ${toAccount} was successful.\n\n Best Regards, \nThe Backend Ledger Team`;
  const html = `<p>Hello ${name}, </p><p>Your transaction of ${amount} to account ${toAccount} was successful.</p><p>Best regards, <br> The Backend Ledger Team <br>`;
   
  await sendEmail(userEmail , subject, text , html);
}

async function sendTransactionFailureEmail(userEmail , name , amount , toAccount){
  const subject = "Transaction Failed";
  const text = `Hello ${name},\n\n We regret to inform you that your transaction of ${amount} to account ${toAccount} was Failed.\n\n Regards, \nThe Backend Ledger Team`;
  const html = `<p>Hello ${name}, </p><p>We regret to inform you that your transaction of ${amount} to account ${toAccount} was Failed.</p><p>Regards, <br> The Backend Ledger Team <br>`;
   
  await sendEmail(userEmail , subject, text , html);
}


module.exports = {
    sendRegisterationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
  };




/** async function sendTransactionEmail (userEmail , name , amount , toAccount){
  console.log("Sending Email to:", userEmail);
  const subject = 'Trnasaction has been Completed Successfuly.';
  const text = `Hello ${name},

   Your transaction has been completed successfully.

   Transaction Details:
   Amount Transferred : ₹${amount}
   Transferred To     : ${toAccount}
   Status             : Successful

   Thank you for using Backend Ledger.

   Best regards,
   The Backend Ledger Team`;
   
  const html = `<p>Hello ${name},</p>

  <p>Your transaction has been completed successfully.</p><p>
  <strong>Transaction Details:</strong>
  <br>Amount Transferred : ₹${amount}
  <br>Transferred To : ${toAccount}<br>
  Status : Successful</p>
  <p>Thank you for using Backend Ledger.</p>
  <p>
    Best regards,<br>
    The Backend Ledger Team
  </p>`;

  await sendEmail(userEmail, subject , text , html);

  console.log("Transaction Complition Email Sent");

}

async function sendTransactionFailureEmail ( userEmail , name , amount ){

}
*/
