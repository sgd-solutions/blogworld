console.log("Blog model called!", Date.now());

const mongoose = require('mongoose');
// const validator = require('validator');

const BlogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    photos: [String],
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
},
{
    timestamps: {
        createdAt: 'created',
        updatedAt: 'updated'
    }
});

BlogSchema.methods.getSchemaValidationMessages = schemaErr => {

    let objErr = {}, errors = schemaErr.errors;

    for( let prop in errors )
    {
        objErr[prop] = errors[prop].message;
    }

    if( !Object.keys(objErr).length )
    {
        objErr['AppError'] = schemaErr.message;
    }

    return objErr;
}

module.exports = mongoose.model('Blog', BlogSchema);
