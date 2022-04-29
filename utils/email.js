const nodemailer = require('nodemailer');
const sendEmail = async options => {
  // 1) Create a transporter
  // if using gmail as service
  //   const transporter = nodemailer.createTransport({
  //     service: 'Gmail',
  //     auth: {
  //       user: process.env.EMAIL_USERNAME,
  //       pass: process.env.EMAIL_PASSWORD
  //     }
  //     // Activate in gmail: "less secure app" option
  //   });
  var transport = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: 'fe99fee9f863f8',
      pass: '8e6e490df59ec8'
    }
  });
  // 2) Define the email options
  const mailOptions = {
    from: 'Pranay Dhongade <pranay@hahaha.io>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };
  // 3) Actually send the email
  await transport.sendMail(mailOptions);
};

module.exports = sendEmail;
