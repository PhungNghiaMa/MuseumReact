import { HandleSignup } from "./LoginAPI";
export default function Login(){
    return (
        <div className="GENERAL_CONTAINER w-full h-full overlfow-hidden">
            <div className="LoginContainer w-full h-full flex justify-center items-center">
                <div className="LoginFormContainer w-1/2 h-auto">
                    <form className="LoginForm w-full h-auto" onSubmit={HandleSignup}>
                        <div className="FormNameContainer w-full h-auto flex justify-center items-center">
                            <h1>SIGN-UP FORM</h1>
                        </div>
                        <div className="ContentContainer w-full h-auto flex flex-row">
                            <div className="EmailContainer w-full h-auto">
                                <label htmlFor="email">Email: </label>
                                <input id="email" className="EmailInput text-black" type="text"></input>
                            </div>
                            <div className="PasswordContainer w-full h-auto">
                                <label htmlFor="password">Password</label>
                                <input id="password" className="PasswordInput text-black" type="password"></input>
                            </div>
                        </div>
                        <div className="SubmitBtnContainer w-full h-auto">
                            <button className="SubmitBtn w-fit h-auto px-2 py-2" type="submit">Signup</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}