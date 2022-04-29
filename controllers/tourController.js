// const fs = require('fs');
const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

//
exports.getAllTours = catchAsync(async (req, res, next) => {
  //BUILD QUERY
  // 1A) Filtering
  // const queryObj = { ...req.query };

  // const excludedFields = ['page', 'sort', 'limit', 'fields'];
  // excludedFields.forEach(el => delete queryObj[el]); //this will remove all params from exclusdedFields in the query

  // // 1B) ADVANCE FILTERING
  // let queryStr = JSON.stringify(queryObj); // converting to string
  // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  // //Here, b for to exact match words, and g for to replace all
  // // console.log(JSON.parse(queryStr));

  // let query = Tour.find(JSON.parse(queryStr));

  //2) Soring
  // if (req.query.sort) {
  //   const sortBy = req.query.sort.split(',').join(' ');
  //   query = query.sort(sortBy);
  //   //sort('price ratingsAverage')
  // } else {
  //   query = query.sort('-createdAt');
  // }

  //3) FIELD LIMITING
  // if (req.query.fields) {
  //   const fields = req.query.fields.split(',').join(' ');
  //   query = query.select(fields);
  //   // query = query.select('name duration price')
  // } else {
  //   query.select('-__v'); //here - means exclude
  // }

  // 4) PAGINATION

  // const page = req.query.page * 1 || 1;
  // const limit = req.query.limit * 1 || 100;
  // const skip = (page - 1) * limit;

  // // page=3&limit=10, 1-10 page 1, 11-20 page 2 ....
  // query = query.skip(skip).limit(limit);

  // if (req.query.page) {
  //   const numTours = await Tour.countDocuments();
  //   if (skip >= numTours) throw new Error('This Page does not exist');
  // }

  //EXECUTE QUERY
  //Tour.find() is query object

  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  // const tours = await Tour.find()
  //   .where('duration')
  //   .equals(5)
  //   .where('difficulty')
  //   .equals('easy');

  //SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours
    }
  });
});
//
exports.getTour = catchAsync(async (req, res, next) => {
  console.log(req.params);
  const tour = await Tour.findById(req.params.id);
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  // Tour.findOne({ _id: req.params.id });
  res.status(200).json({
    status: 'success',
    data: {
      tour: tour
    }
  });
});

//
exports.createTour = catchAsync(async (req, res, next) => {
  // const newTour = new Tour({});
  // newTour.save();

  const newTour = await Tour.create(req.body); //better
  console.log(newTour);
  res.status(200).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
});
//
exports.updateTour = catchAsync(async (req, res, next) => {
  const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour: updatedTour
    }
  });
});
//
exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    message: 'Successfully Deleted the Tour!',
    data: null
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    // stages
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        // _id: '$ratingsAverage',

        num: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: {
        avgPrice: 1
      }
    }
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates' // creates one document for each start date from a doc with startdates
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 }, //create new field of total tours
        tours: { $push: '$name' } //creates an array of all tour names for that month
      }
    },
    {
      $addFields: {
        month: '$_id'
      }
    },
    {
      $project: {
        _id: 0 // id will no longer show up in data
      }
    },
    {
      $sort: {
        numTourStarts: -1 //-1 for decending
      }
    },
    {
      $limit: 12 //not needed
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});
/***************************************************************************************/
// Testing using local json file
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// route handles
//middleware to check id

// exports.checkId = (req, res, next, val) => {
//   const id = req.params.id * 1;

//   if (id > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid-Id'
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price'
//     });
//   }
//   next();
// };
// exports.getAllTours = (req, res) => {
//   console.log(req.requestTime);
//   res.status(200).json({
//     status: 'success',
//      results: tours.length,
//      requestedAt: req.requestTime,
//      data: {
//        tours: tours
//      }
//   });
// };
// // get one tour
//  exports.getTour = (req, res) => {
//   created a variable id by adding /:id (must be provided)
//    '/api/v1/tours/:id/:y?'  here /:y? creates a optional param

//    const id = req.params.id * 1; //converting id to number
//    const tour = tours.find(el => el.id == id);

//   // if tour exists
//    res.status(200).json({
//      status: 'success',
//      data: {
//        tour: tour
//      }
//    });
// };

// // posting a tour
// exports.createTour = (req, res) => {
//   console.log(req.body);

//   const newId = tours[tours.length - 1].id + 1;
//   const newTour = Object.assign({ id: newId }, req.body); // add new id in body object

//   tours.push(newTour); //adding new tour
//   fs.writeFile(
//     `${__dirname}/dev-data/data/tours-simple.json`,
//     JSON.stringify(tours),
//     err => {
//       // sending a response
//       res.status(201).json({
//         status: 'success',
//         data: {
//           tour: newTour
//         }
//       });
//     }
//   );
//   // res.send('Done!');
// };
// // updating tour
// exports.updateTour = (req, res) => {
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: 'Updated tour'
//     }
//   });
// };
// // delete Tour
// exports.deleteTour = (req, res) => {
//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// };
