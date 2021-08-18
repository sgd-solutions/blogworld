console.log("FileUpload module called!", Date.now());

// ------------------ Core Modules ------------------- //
const path = require('path');
const fs = require('fs');
// ----------------------- X ------------------------- //

// ---------------- Third Party Modules -------------- //
const multer = require('multer');
// ----------------------- X ------------------------- //

function FileUpload(filePath, fileType, fields, fileSizeLimit = Infinity)
{
    // ------------------ Private Members ------------------- //
    var _self = this;
    var _path;
    var _fileType;
    var _fieldsOption;
    var _fileSizeLimit;
    var _fileStorage;
    var _multerInstance;
    // ------------------------- X -------------------------- //
    
    // ------------------- Private Methods ------------------- //
    var _setPath = function(filePath) {
        _path = filePath;
    }

    var _getPath = function() {
        return _path;
    }

    var _setFileType = function(fileType) {
        _fileType = fileType;
    }

    var _getFileType = function() {
        return _fileType;
    }

    var _setFileSizeLimit = function(fileSizeLimit) {
        _fileSizeLimit = fileSizeLimit;
    }

    var _getFileSizeLimit = function() {
        return _fileSizeLimit;
    }

    var _setFields = function(fields) {
        _fieldsOption = fields;
    }

    var _getFields = function() {
        return _fieldsOption;
    }

    var _setStorage = function() {
        _fileStorage = multer.diskStorage({
            destination: function(req, file, cb) {
                console.log('Inside destination callback:', Date.now());
                cb(null, _getPath());
            },
            filename: function(req, file, cb) {
                console.log('Inside filename callback:', Date.now());
                let ext = path.extname(file.originalname).toLowerCase();
                let uniqueToken = `__${Date.now()}_${Math.round(Math.random() * 100000)}__`;
                let renamedFileName = uniqueToken + ext;
        
                cb(null, renamedFileName);
            }
        });
    }

    var _getStorage = function() {
        return _fileStorage;
    }

    var _createMulterInstance = function() {
        let fileSizeLimit = _getFileSizeLimit();
        let fields = _getFields();

        let multerOptions = {
            storage: _getStorage(),
            fileFilter: (req, file, cb) => {
                // console.log('Inside fileFilter', Date.now());
                
                let fileType = _getFileType();
                if( _checkValidFileExtension(file, fileType) )
                {
                    cb(null, true);
                }
                else
                {
                    cb(new Error(`Invalid extension for ${fileType} file`, false));
                }
            }
        };

        if( fileSizeLimit > 0 && fileSizeLimit < Infinity )
        {
            multerOptions.limits = { fileSize: fileSizeLimit };
        }

        if( typeof fields === 'string' )
        {
            _multerInstance = multer(multerOptions).single(fields);
        }
        if( Array.isArray(fields) )
        {
            _multerInstance = multer(multerOptions).fields(fields);
        }
    }

    var _getMulterInstance = function() {
        return _multerInstance;
    }

    var _checkValidFileExtension = (file, fileType) => {
        // console.log('Inside _checkValidFileExtension():');
        let arrImageFileExt = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];
        let fileExt = path.extname(file.originalname).toLowerCase();
        let flag;
        
        switch( fileType )
        {
            case 'image':
                flag = arrImageFileExt.includes(fileExt);
                break;
            case 'doc':
                    break;
            default:
                flag = false;
        }
        
        return flag;
    }
    // -------------------------- X -------------------------- //
    
    // ------------------- Public Methods ---------------------- //
    this.setPath = function(filePath) {
        _setPath(filePath);
    }

    this.upload = function() {
        return _getMulterInstance();
    }
    
    this.getFileCustomErrorMessage = (err) => {
        let errMsg = "";
    
        // if( err instanceof multer.MulterError )
        switch( err.code )
        {
            case 'LIMIT_FILE_SIZE':
                errMsg = "Upload file size maximum limit exceeded.";
                break;
            case 'LIMIT_FILE_COUNT':
                errMsg = "Upload file count maximum limit exceeded.";
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                errMsg = "Number of upload file(s) limit exceeded.";
                break;
            default:
                errMsg = err.message;
        }
        
        return errMsg;
    }
    
    this.getUploadedFileNames = (files) => {
        let prop, length, objFiles = {};
        for( prop in files )
        {
            length = files[prop].length;
            if( length > 0 )
            {
                objFiles[prop] = files[prop].map(v => v.filename);
            }
        }
    
        return objFiles;
    }

    this.deleteFiles = (files) => {
        let counter = 0, filePath = _getPath();
        for( let prop in files )
        {
            if( files[prop].length > 0 )
            {
                for( let val of files[prop] )
                {
                    fs.unlink(val.path, () => {
                        console.log(`#${++counter}. File deleted successfully`);
                    });
                }
            }
        }
    }
    // --------------------------- X --------------------------- //

    (function(filePath, fileType, fields, fileSizeLimit) {
        _setPath(filePath);
        _setFileType(fileType);
        _setFields(fields);
        _setFileSizeLimit(fileSizeLimit);
        _setStorage();
        _createMulterInstance();
    })(filePath, fileType, fields, fileSizeLimit);

}

module.exports = FileUpload;