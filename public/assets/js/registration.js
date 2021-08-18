function Registration()
{
    // ----------------- Properties ----------------- //
    this.scriptName = "registration.js";
    this.isFormValid = false;
    this.isUsernameExist = false;
    this.isEmailExist = false;
    this.$hdnUsernameExist = $('#hdnUsernameExist');
    this.$hdnEmailExist = $('#hdnEmailExist');
    this.$errorOptions = $('#errorOptions');
    this.$divMsg = $('#divMsg');
    this.$frmRegistration = $('#frmRegistration');
    this.$username = $('#username');
    this.$email = $('#email');
    this.$btnSubmit = $('#btnSubmit');

    // ------------------- Methods ------------------- //
    this.init = () => {
        this.attachHandlers();
    }

    this.attachHandlers = () => {
        this.$username.on('change', this.checkUsername);
        this.$email.on('change', this.checkEmail);
        this.$btnSubmit.on('click', this.submitForm);
    }

    this.checkUsername = async () => {
        let self = this;
        let errorOptions = JSON.parse(this.$errorOptions.val());

        self.$hdnUsernameExist.val(''); // Make this value blank first
        // self.$username.next().remove();

        fetch('/users/check_username', {
            method: "POST",
            body: self.$username.serialize(),
            cache: "no-cache",
            headers: {
                'Content-Type': "application/x-www-form-urlencoded",
                'Accept': "application/json",
                "Connection": "keep-alive"
            }
        })
        .then(response => {
            if( !response.ok )
            {
                throw new Error("Network issue");
            }

            return response.json();
        })
        .then(response => {
            if( response.error )
            {
                self.isFormValid = false;
            }
            if ( response.exist )
            {
                self.$hdnUsernameExist.val(JSON.stringify(response));
            }
            
            self.displayMsgs(response, true);
            console.info(response);
        })
        .catch(err => {
            console.error(`Something went wrong...${err}`);
            self.$divMsg.text(`Something went wrong: ${res}`).addClass(errorOptions.errorClass).show();
        });
    }

    this.checkEmail = async () => {
        let self = this;
        let objResponse, jsonResponse;
        let errorOptions = JSON.parse(this.$errorOptions.val());

        self.$hdnEmailExist.val(''); // Make this value blank first
        //self.$email.next().remove();

        try
        {
            objResponse = await fetch('/users/check_email', {
                method: "POST",
                body: JSON.stringify({email: self.$email.val()}),
                cache: "no-cache",
                headers: {
                    'Content-Type': "application/json",
                    'Accept': "application/json",
                    "Connection": "keep-alive"
                }
            });

            if( !objResponse.ok )
            {
                throw new Error("Network issue");
            }

            jsonResponse = await objResponse.json();

            if( jsonResponse.error )
            {
                self.isFormValid = false;
            }
            if ( jsonResponse.exist )
            {
                self.$hdnEmailExist.val(JSON.stringify(jsonResponse));
            }
            
            self.displayMsgs(jsonResponse, true);
            console.info(jsonResponse);
        }
        catch( err )
        {
            console.error(`Something went wrong...${err}`);
            self.$divMsg.text(`Something went wrong: ${res}`).addClass(errorOptions.errorClass).show();
        }
    }

    this.submitForm = () => {
        console.log("Clicked!");
        console.log(this);

        let self = this;
        let errorOptions = JSON.parse(this.$errorOptions.val());
        let formData = new FormData(this.$frmRegistration.get(0));
        // let formData = new FormData(document.getElementById('frmRegistration'));
        
        /* for( var pair of formData.entries() ) {
            console.log(pair[0], pair[1]);
        } */
        
        jQuery.ajax({
            url: '/users/registration',
            method: 'POST',
            enctype: 'multipart/form-data',
            data: formData,
            contentType: false,
            processData: false,
            cache: false,
            beforeSend: function() {
                self.$frmRegistration.find('input, button').prop('disabled', true);
                self.$divMsg.text('').removeClass(`${errorOptions.frmErrorClass} ${errorOptions.frmSuccessClass}`);
            }
        })
        .done(function(res) {
            console.log('Done:', res);
            
            if( res.error )
            {
                self.displayMsgs(res);
            }
            if( res.success )
            {
                self.$divMsg.text(res.messages).addClass(errorOptions.frmSuccessClass).fadeIn();
                self.$frmRegistration.get(0).reset();
                self.displayMsgs(null); // Remove all next to fields' message
                
                setTimeout(function() {
                    window.location.assign(res.redirect);
                }, 5000);
            }
        })
        .fail(function(res) {
            console.error(`Something went wrong: ${res}`);
            self.$divMsg.text(`Something went wrong: ${res}`).addClass(errorOptions.frmErrorClass).fadeIn();
        })
        .always(function(res) {
            console.info("Always:");
            if( !res.success )
            {
                self.$frmRegistration.find('input, button').prop('disabled', false);
            }
        });
        
    }

    this.displayMsgs = (response, singleField = false) => {
        let errorOptions = JSON.parse(this.$errorOptions.val());
        let errors = response && response.messages ? response.messages : {};

        if( errorOptions.formFields )
        {
            if( !singleField )
            {
                $(`${errorOptions.wrapper}.${errorOptions.errorClass}`).remove();
            }

            for( const key in errors )
            {
                let elem = document.createElement(errorOptions.wrapper);
                $(elem).text(errors[key]).addClass(errorOptions.errorClass);
                
                if( errorOptions.position === 'before' )
                {
                    if( singleField )
                    {
                        $(`#${key}`).prev(`${errorOptions.wrapper}.${errorOptions.errorClass}`).remove();
                    }

                    if( response.error )
                    {
                        $(`#${key}`).before(elem);
                    }
                }
                if( errorOptions.position === 'after' )
                {
                    if( singleField )
                    {
                        $(`#${key}`).next(`${errorOptions.wrapper}.${errorOptions.errorClass}`).remove();
                    }
                    
                    if( response.error )
                    {
                        $(`#${key}`).after(elem);
                    }
                }

                if( key === 'AppError' )
                {
                    $(`#${errorOptions.elemId}`).text(`${key}: ${errors[key]}`).addClass(errorOptions.frmErrorClass).slideDown();
                }
            }
        }
        else if( Object.keys(errors).length )
        {
            let arrErrMsg = Object.values(errors);
            let msgOutput = `<ul><li>${arrErrMsg.join('</li><li>')}</li></ul>`;
            $(`#${errorOptions.elemId}`).html(msgOutput).addClass(errorOptions.frmErrorClass).slideDown();
        }
    }
}

jQuery(function() {
    console.info("Document is ready!");
    
    let objRegistration = new Registration();
    objRegistration.init();
});