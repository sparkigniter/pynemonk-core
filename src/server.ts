import express from 'express';
import AuthenticationController from './api/modules/auth/controllers/AuthenticationController';
const router = express.Router();
const app = express();

//TODO : Move this to seperate routes folder
app.post('/login',  (req, res) => {
    return AuthenticationController.login(req, res);
})

app.listen(3000, () => {
    console.log(`Example app listening on port ${3000}`);
});
