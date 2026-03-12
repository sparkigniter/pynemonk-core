import "reflect-metadata";
import express from 'express';
import dotenv from 'dotenv'; 
import bodyParser from "body-parser";
//import AuthenticationController from './api/modules/auth/controllers/AuthenticationController';
import oauthRouter from './api/modules/oauth2/routes.ts';
import setupDI from './di.ts';


const app = express();

app.use(bodyParser.json());
dotenv.config();  // Load environment variables from .env file

setupDI(); // Set up dependency injection

app.use('/oauth2', oauthRouter);

app.listen(3000, () => {
    console.log(`Example app listening on port ${3000}`);
});
