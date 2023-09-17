import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import styled from "@emotion/styled";
import { retrieveAllPlaylists } from "./constants";

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

interface Credential {
	credential: string;
	clientId: string;
	select_by: 'btn';
}

function App() {

	const [credentials, setCredentials] = useState<Credential | null>(null)

	useEffect(() => {
		console.log(credentials);
	}, []);

	return (
		<>
			<GoogleLoginWrapper>
				<GoogleLogin
					onSuccess={(credentialResponse) => {
						setCredentials(credentialResponse as Credential);
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
				<a onClick={() => retrieveAllPlaylists()}>fetch all</a>
			</button>
			{/* <button>
				<a href={getOAuthRedirect()}>sign in with google</a>
			</button> */}
		</>
	);
}

export default App;
