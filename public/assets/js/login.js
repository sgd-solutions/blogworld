function Login()
{
    // ----------------- Properties ----------------- //
    this.scriptName = "login.js";
    // --------------------- X ---------------------- //

    // ------------------- Methods ------------------- //
    this.init = () => {
        return this.setProperties().attachHandlers();
    }

    this.setProperties = () => {
        this.isFormValid = false;
        this.$divMsg = $('#divMsg');
        this.formErrorClass = 'validation-error';
        this.formSuccessClass = 'validation-success';
        this.fieldErrorClass = 'field-error';
        this.fieldSuccessClass = 'field-success';
        this.$formLogin = $('#formLogin');
        this.$username = $('#username');
        this.$password = $('#password');
        this.$btnSubmit = $('#btnSubmit');
        this.animationDelay = 450;

        return this;
    }

    this.attachHandlers = () => {
        this.$formLogin.on('submit', this.submitForm);
        // this.$btnSubmit.on('click', this.submitForm);

        return this;
    }

    
    this.checkForm = () => {
        console.log('checkForm');
        let boolFlag = true;

        this.$divMsg.text('').removeClass(this.formErrorClass).hide();
        $(`.${this.fieldErrorClass}`).remove();
        
        if( !this.$username.val().trim() )
        {
            boolFlag = false;
            this.$username.after(`<div class="${this.fieldErrorClass}">Please enter username</div>`);
        }
        if( !this.$password.val().trim() )
        {
            boolFlag = false;
            this.$password.after(`<div class="${this.fieldErrorClass}">Please enter password</div>`);
        }

        return boolFlag;
    }
    
    this.submitForm = async e => {
        e.preventDefault();
        console.log('submitForm');
        console.log(e);

        if( !this.checkForm() )
        {
            return false;
        }

        let objResponse, jsonResponse;
        let formData = this.$formLogin.serialize();

        this.$formLogin.find('input, button').prop('disabled', true);
        
        try
        {
            objResponse = await fetch('/users/login', {
                method: "POST",
                body: formData,
                cache: "no-cache",
                headers: {
                    'Content-Type': "application/x-www-form-urlencoded",
                    'Accept': "application/json",
                    "Connection": "keep-alive"
                }
            });
            console.info('objResponse:', objResponse.headers);

            if( !objResponse.ok )
            {
                throw new Error("Network issue");
            }

            jsonResponse = await objResponse.json();
            console.info('jsonResponse:', jsonResponse);

            if( jsonResponse.error )
            {
                this.$divMsg.text(jsonResponse.message).addClass(this.formErrorClass).fadeIn(this.animationDelay);
            }
            else
            {
                this.$divMsg.text(jsonResponse.message).addClass(this.formSuccessClass).fadeIn(this.animationDelay);
                
                setTimeout(function() {
                    window.location.assign(jsonResponse.redirect);
                }, 3000);

                // localStorage.setItem('AccessToken', jsonResponse.accessToken);
            }
        }
        catch( err )
        {
            console.error(`Something went wrong...${err}`);
            this.$divMsg.text(`Something went wrong: ${res}`).addClass(formErrorOptions.errorClass).fadeIn(this.animationDelay);
        }
        finally
        {
            if( jsonResponse.error )
            {
                this.$formLogin.find('input, button').prop('disabled', false);
            }
        }
    }

}

jQuery(function() {
    console.info("Document is ready!");
    // console.info('AccessToken:', localStorage.getItem('AccessToken'));
    
    let objLogin = new Login();
    objLogin.init();
});