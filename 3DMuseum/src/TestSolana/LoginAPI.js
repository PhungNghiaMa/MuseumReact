import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import auth from './firebaseConfig';
const ABTRACT_API_KEY = import.meta.env.VITE_ABTRACT_API_KEY;
// HANDLE VALIDATE EMAIL USING ABSTRACT API
 async function validateEmail(email) {
    const response = await fetch(
        `https://emailvalidation.abstractapi.com/v1/?api_key=4a710a82920b4fceba3c64edb0b44c34&email=${email}`,
        {
            method: "GET"
        }
    );
    const validateResult = await response.json();
    console.log("Validate result: ", validateResult);

    if (
        validateResult.deliverability !== "DELIVERABLE" || validateResult.is_valid_format.value === false || validateResult.is_disposable_email.value === true  || validateResult.is_role_email.value === true
    ){
        return {valid: false , reason:"Undelivarble / Diposable / Invalid format / Is role email"}
    }else{
        return {valid: true};
    }

}
// APPLY FIREBASE HERE TO SEND THE TOKEN TO BACKEND TO VERIFIES IF USER 
export async function HandleSignup(e){
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const isAdmin = false;

    if (email.toString().includes("admin")) {
        isAdmin = true;
    }

    if(!email || !password){
        alert("Email and passwrod are required !");
        return ;
    }
    console.log("Email: ", email);
    console.log("Password: ", password);

    // check valid mail 
    const ValidMail = await validateEmail(email);   
    console.log("VALID: ", ValidMail.valid); 
    if (ValidMail.valid === false){
        alert(`Invalid email: ${email}`)
        return;
    }

    // send request to backend
    try{
        // create User with firebase
        const userCredential = await createUserWithEmailAndPassword(auth,email,password);

        // Optionally send a verification email
        await sendEmailVerification(userCredential.user);

        // Get firebase ID token
        const idToken = await userCredential.user.getIdToken();
        console.log("FIREBASE_ID_TOKEN: ", idToken);

        // send Token to backend
        const backendResponse = await fetch('http://localhost:8000/auth/register', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                email: userCredential.user.email,
                uid: userCredential.user.uid,
                createdAt: userCredential.user.metadata.creationTime,
                isAdmin: isAdmin,
            })
        });

        const response = await backendResponse.json();
        if (backendResponse.ok){
            alert('Signup successfully !')
        }else{
            if(response.message === undefined){
                alert('Fail to sign up: No message from backend');
            }else{
                alert('Fail to sign up: ', response.message);
            }
        }

    }catch(error){
        console.log("Signup error: ",error);
        alert('Signup failed. Check console for more details.');
        return;
    }
}

