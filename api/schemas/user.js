const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
        email: {
                type: String,
                unique: true,
                required: true,
                trim: true
        },
        password: {
                type: String,
                required: true,
        },
        securityQuestionOne: {
                question: {
                        type: String,
                        required: true,
                },
                answer: {
                        type: String,
                        required: true,
                        lowercase: true,
                },
        },
        securityQuestionTwo: {
                question: {
                        type: String,
                        required: true,
                },
                answer: {
                        type: String,
                        required: true,
                        lowercase: true,
                },
        },
});
