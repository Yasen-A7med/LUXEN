import { Router, type IRouter } from "express";
import healthRouter from "./health";
import employeesRouter from "./employees";
import attendanceRouter from "./attendance";
import salariesRouter from "./salaries";
import employeeFilesRouter from "./employee-files";
import tasksRouter from "./tasks";
import chatRouter from "./chat";
import projectsRouter from "./projects";
import clientsRouter from "./clients";
import backupRouter from "./backup";

const router: IRouter = Router();

router.use(healthRouter);
router.use(employeesRouter);
router.use(attendanceRouter);
router.use(salariesRouter);
router.use(employeeFilesRouter);
router.use(tasksRouter);
router.use(chatRouter);
router.use(projectsRouter);
router.use(clientsRouter);
router.use(backupRouter);

export default router;
