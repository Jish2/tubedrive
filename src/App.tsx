import { useEffect } from "react";
import "./App.css";
import { GoogleLogin } from "@react-oauth/google";
import styled from "@emotion/styled";

const getOAuthRedirect = () => {
	const scope = "https://www.googleapis.com/auth/youtubepartner";
	const client_id = import.meta.env.VITE_GOOGLE_CLIENTID;
	const redirect_uri = import.meta.env.VITE_REDIRECT_URI;

	return `https://accounts.google.com/o/oauth2/v2/auth?
scope=${scope}&
include_granted_scopes=true&
state=state_parameter_passthrough_value&
redirect_uri=${redirect_uri}&
response_type=token&
client_id=${client_id}
  `;
};

const GoogleLoginWrapper = styled.div`
	color-scheme: light;
`;

function App() {
	useEffect(() => {}, []);

	return (
		<>
			<GoogleLoginWrapper>
				<GoogleLogin
					onSuccess={(credentialResponse) => {
						console.log(credentialResponse);
					}}
					onError={() => {
						console.log("Login Failed");
					}}
					// useOneTap
				/>
			</GoogleLoginWrapper>
			<div>
				<a href="https://developers.google.com/youtube/v3/guides/implementation/playlists">link to api docs</a>
			</div>
			<button>
				<a href={getOAuthRedirect()}>sign in with google</a>
			</button>
		</>
	);
}

export default App;
