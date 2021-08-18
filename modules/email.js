const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    // host: 'smtp.gmail.com',
    // port: 465,
    // secure: true,
    auth: {
        // type: 'OAuth2',
        type: 'login',
        user: 'sreetanu.gd@gmail.com'
    }
});

let mailOptions = {
    from: 'sreetanu.gd@gmail.com',
    to: 'lovepiku@gmail.com, aditi.ray.4ever@gmail.com',
    subject: 'Sending test email from `Node.js` application using `Nodemailer`',
    // text: 'This is test body!'
    html: `<h2>This is test header!</h2>
            <p><em>This is test body!</em></p>
            
            <h3>Thanks & Regards</h3>
            <h4>Sreetanu Ghosh Dastidar</h4>`
};

transporter.verify((error, success) => {
    if( error )
    {
        console.error(error.name, ':', error.message);
    }
    else
    {
        console.info('Success :', success);
        transporter.sendMail(mailOptions, (error, info) => {
            if( error )
            {
                console.error(error.name, ':', error.message);
            }
            else
            {
                console.info('Email sent:', info);
            }
        });
    }
});

