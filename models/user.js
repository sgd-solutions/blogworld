console.log("User model called!", Date.now());

const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

const Schema = mongoose.Schema;

let UserSchema = new Schema({
    profile_pic: {
        type: String
    },
    f_name: {
        type: String,
        required: [true, "First name is required"],
        trim: true
    },
    l_name: {
        type: String,
        trim: true
    },
    age: {
        type: Number,
        required: [true, "Age is required"],
        cast: "Age should be a number",
        min: [18,"Age must be 18 years and above"],
        max: [100,"Maximum age limit is 100"]
    },
    gender: {
        type: String,
        required: [true, "Gender is required"],
        enum: {
            values: ['M', 'F'],
            message: "Gender value should be either 'M' or 'F'"
        }
    },
    username: {
        type: String,
        required: [true, "Username is required"],
        trim: true,
        minlength: [4, "Username should be at least 4 characters long"]
        /* validate: { // This validation will be a promblem during updating document
            validator: async (value) => {
                console.log('STARTS username uniqueness checking', Date.now());
                let result;
                try
                {
                    result = await mongoose.model('User').countDocuments({username: value}).exec();
                }
                catch(err)
                {
                    console.error(err);
                    throw err;
                }
                console.log('ENDS username uniqueness checking', Date.now());

                return !result;
            },
            message: (prop) => `This username '${prop.value}' is already taken`
        } */
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        trim: true,
        minlength: [6, "Password length must be at least 6 characters long"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        validate: [{
            validator: (value) => {
                return validator.isEmail(value);
            },
            message: (prop) => `'${prop.value}' is not a valid email`
        }/* ,
        { // This validation will be a promblem during updating document
            validator: async (value) => {
                console.log('STARTS email uniqueness checking', Date.now());
                let result;
                try
                {
                    result = await mongoose.model('User').countDocuments({email: value}).exec();
                }
                catch(err)
                {
                    console.error(err);
                    throw err;
                }
                console.log('ENDS email uniqueness checking', Date.now());

                return !result;
            },
            message: (prop) => `This email '${prop.value}' is already registered`
        } */]
    },
    is_admin: {
        type: Boolean,
        default: false
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
},
{
    timestamps: {
        createdAt: 'created',
        updatedAt: 'updated'
    }
});

UserSchema.virtual('full_name').get(function() {
    return this.f_name + " " + this.l_name;
});

/* UserSchema.pre('save', function(done) {
    console.log("Pre save!");
    console.info(this);
    done();
}); */

// Format Schema error object into a user friendy error message format
UserSchema.methods.getSchemaValidationMessages = schemaErr => {

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

UserSchema.statics.checkEmailExistence = function(value, callback = null) {
    console.log('STARTS checkEmailExistence', Date.now());

    let promiseCount = this.countDocuments({email: value}).exec();

    if( callback && typeof callback === "function" )
    {
        promiseCount
        .then(result => callback(null, result))
        .catch(err => {
            console.error(err);
            callback(err, null);
        })
        .finally(() => {
            console.log('ENDS checkEmailExistence', Date.now());
        });

        return;
    }

    console.log('ENDS checkEmailExistence', Date.now());
    return promiseCount;
}

UserSchema.statics.checkUsernameExistence = function(value, callback = null) {
    console.log('STARTS checkUsernameExistence', Date.now());

    let promiseCount = this.countDocuments({username: value}).exec();

    if( callback && typeof callback === "function" )
    {
        promiseCount
        .then(result => callback(null, result))
        .catch(err => {
            console.error(err);
            callback(err, null);
        })
        .finally(() => {
            console.log('ENDS checkUsernameExistence', Date.now());
        });

        return;
    }

    console.log('ENDS checkUsernameExistence', Date.now());
    return promiseCount;
}

UserSchema.statics.encryptPassword = async password => await bcrypt.hash(password, await bcrypt.genSalt(11));

UserSchema.statics.checkPassword = async (password, hashedPassword) => await bcrypt.compare(password, hashedPassword);

UserSchema.statics.authenticateUser = async function(username, password) {
    console.log('STARTS getAuthenticateUser:', Date.now());
    let json = {error: false, message: '', user: null};

    try
    {
        let result = await this.findOne({'username': username}).exec();
        console.log('result:', result);
        if( !result )
        {
            json.error = true;
            json.message = "Username does not exist";
            console.log('#1 json:', json);
        }
        else
        {
            if ( !await this.checkPassword(password, result.password) )
            {
                json.error = true;
                json.message = "Invalid password";
            }
            else
            {
                json.user = result;
            }
        }
    }
    catch( err )
    {
        json.error = true;
        json.message = '#1. Something went wrong on the server side';
        console.error('Caught in Authentication:', err);
    }

    console.log('ENDS getAuthenticateUser:', Date.now());
    return json;
}

module.exports = mongoose.model('User', UserSchema);