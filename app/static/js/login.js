function togglePassword() {

            const passwordInput =
                document.getElementById('senha');

            const toggleIcon =
                document.querySelector('.password-toggle');
            
            if (passwordInput.type === 'password') {

                passwordInput.type = 'text';

                toggleIcon.className =
                    'fa-solid fa-eye-slash password-toggle';

            } else {

                passwordInput.type = 'password';

                toggleIcon.className =
                    'fa-regular fa-eye password-toggle';
            }
        }
