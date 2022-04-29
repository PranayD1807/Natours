const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const tourRouter = require('./routes/tour-routes');
const userRouter = require('./routes/user-routes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// middlewares
// 1) GLOBAL MIDDLEWARE

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, //in miliseconds
  message: 'Too many requests from this IP, please try again in an hour!'
});

app.use('/api', limiter);

// Set Security HTTP headers
app.use(helmet());

// Development loggin
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());
// Data Sanitization against XSS
app.use(xss());
// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);
// Serving static fields
app.use(express.static(`${__dirname}/public`));

// creating a middleware
// app.use((req, res, next) => {
//   console.log('Hello from the middleware 👌');
//   next();
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//routes (Middlewares too)
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//This will run for all routes that weren't catched by middlewares before
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); //anything you pass into next will be assumed to be error
});
//this is an error handling middleware
app.use(globalErrorHandler);
module.exports = app;
