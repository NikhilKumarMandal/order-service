import express, { Request, Response } from "express";
import { globalErrorHandler } from "./common/middleware/globalErrorHandler";
import cookieParser from "cookie-parser";
import customerRouter from "./customer/customer.routes"
import couponRouter from "./coupon/coupan.routes"
const app = express();
app.use(cookieParser());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from order service service!" });
});


app.use("/api/v1/customer",customerRouter)
app.use("/api/v1/coupon", couponRouter)

app.use(globalErrorHandler);

export default app;
