import { Router } from "express";
import userRoute from "./userRouter.js";
import sleepRouter from "./sleepRouter.js";
import reportRouter from "./reportRouter.js";
import articlesRouter from "./articlesRouter.js";
import adhkarRouter from "./adhkarRouter.js"; 
import pointsRouter from "./pointsRouter.js";

const mainRouter = Router();

// user router :
mainRouter.use('/user', (req, res, next) => {
  console.log('User router accessed');
  next();
}, userRoute);

// sleep data router :
mainRouter.use('/sleep', (req, res, next) => {
  console.log('Sleep router accessed');
  next();
}, sleepRouter);

// report router :
mainRouter.use('/report', (req, res, next) => {
  console.log('Report router accessed');
  next();
}, reportRouter);

// articles router :
mainRouter.use('/articles', (req, res, next) => {
  console.log('Articles router accessed');
  next();
}, articlesRouter);

//  adhkar router :
mainRouter.use('/adhkar', (req, res, next) => {
  console.log('Adhkar router accessed');
  next();
}, adhkarRouter);
// points router :
mainRouter.use('/points', (req, res, next) => {
  console.log('Points router accessed');
  next();
}, pointsRouter);



export default mainRouter;
