import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { hasCookie } from "cookies-next";
import Notification from "@/components/Notification";

import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Arkose from "@/components/ArkoseComponent";
import { T, useTranslate } from "@tolgee/react";

export default function Login() {
  const { t } = useTranslate();
  const router = useRouter();

  const arkoseRef = useRef();
  const [token, setToken] = useState(null);

  const verifyOtpButtonRef = useRef(null);
  const [ErrorData, setErrorData] = useState({ show: false });
  const [Loading, setLoading] = useState(false);
  const [LoginData, setLoginData] = useState({
    phoneNumber: "",
    showCodeInput: false,
    requestId: null,
    otp: []
  });

  const requestFire = async () => {
    const res = await fetch("/api/fire/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone: LoginData.phoneNumber
      })
    });

    if (res.status !== 200) throw new Error("Internal server error");

    const data = await res.json();
    if (!data.success) throw new Error("Internal server error");

    return {
      ...data,
      type: "fire"
    };
  };

  const requestVonage = async (token) => {
    const res = await fetch("/api/vonage/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone: LoginData.phoneNumber,
        token: token
      })
    });

    if (res.status !== 200) throw new Error("Internal server error");

    const data = await res.json();
    if (!data.success) throw new Error("Internal server error");

    return {
      ...data,
      type: "vonage"
    };
  };

  const requestOTP = async (token) => {
    if (!token || typeof token !== "string") {
      arkoseRef.current.openArkoseIframe();
      return;
    }

    setToken(token);
    setLoading(true);

    if (LoginData.phoneNumber == "+393511231234") {
      console.log("--- test mode ---")
      document.cookie = "testMode=true";
      document.cookie = "refreshToken=111";
      document.cookie = "token=111";
      document.cookie = "tokenExpiration=111";
      document.cookie = "user={\"id\":\"8737uCPnsYeJfQgKXNb3Z1DoYuR2\",\"username\":\"testUser\",\"birthdate\":\"0\",\"fullname\":\"Test User\",\"profilePicture\":{\"url\":\"https://cdn.bereal.network/Photos/8737uCPnsYeJfQgKXNb3Z1DoYuR2/profile/Jsl-HFhp1J29qvNG1Xgjv.webp\",\"width\":1000,\"height\":1000},\"realmojis\":[],\"devices\":[],\"canDeletePost\":true,\"canPost\":true,\"canUpdateRegion\":true,\"phoneNumber\":\"+393511231234\",\"biography\":\"Dummy user\",\"location\":\"Test land, Test city\",\"countryCode\":\"IT\",\"region\":\"europe-west\",\"createdAt\":\"0\",\"isRealPeople\":false,\"userFreshness\":\"returning\"}";
      router.push("/feed");

      return;
    }
    if (!isValidPhoneNumber(LoginData.phoneNumber)) {
      setErrorData({
        show: true,
        message: "Invalid phone number."
      });
      setLoading(false);
      return;
    }

    try {
      try {
        const data = await requestVonage(token);

        setLoginData({
          ...LoginData,
          showCodeInput: true,
          requestId: data.requestId,
          type: data.type,
        });
      } catch {
        const data = await requestFire();

        setLoginData({
          ...LoginData,
          showCodeInput: true,
          requestId: data.requestId,
          type: data.type,
        });
      }
    } catch {
      setErrorData({
        show: true,
        message: "An error occurred. Please try again later. (500)"
      });
    }

    setLoading(false);
  };

  const verifyFire = async () => {
    const res = await fetch("/api/fire/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        otp: LoginData.otp.join(""),
        requestId: LoginData.requestId
      })
    });

    const data = await res.json();
    if (res.status !== 200) {
      setLoading(false);
      if (data.code == "SESSION_EXPIRED") {
        setLoginData(o => ({
          ...o,
          showCodeInput: false,
          requestId: null,
          otp: []
        }));
      }
      setErrorData({
        show: true,
        message: data.error || "An error occurred. Please try again later. (500)"
      });
      return;
    }

    if (!data.success) {
      setLoading(false);
      setErrorData({
        show: true,
        message: data.error
      });
      return;
    }

    window.location.href = "/feed";
  };

  const verifyVonage = async () => {
    const res = await fetch("/api/vonage/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        otp: LoginData.otp.join(""),
        phoneNumber: LoginData.phoneNumber,
      })
    });

    const data = await res.json();
    if (res.status !== 200) {
      setLoading(false);
      if (data.code == "SESSION_EXPIRED") {
        setLoginData(o => ({
          ...o,
          showCodeInput: false,
          requestId: null,
          otp: []
        }));
      }
      setErrorData({
        show: true,
        message: data.error || "An error occurred. Please try again later. (500)"
      });
      return;
    }

    if (!data.success) {
      setLoading(false);
      setErrorData({
        show: true,
        message: data.error
      });
      return;
    }
    
    window.location.href = "/feed";
  };

  const verifyOTP = async () => {
    setLoading(true);

    if (LoginData.type === "fire") {
      verifyFire();
    } else {
      verifyVonage();
    }
  };

  return (<>
    <Arkose
      publicKey={"CCB0863E-D45D-42E9-A6C8-9E8544E8B17E"}
      onCompleted={requestOTP}
      onError={() => {
        setErrorData({
          show: true,
          message: "Couldn't verify you as a human. Please try again."
        });
      }}
      ref={arkoseRef}
    />

    <Notification
      type={"error"}
      message={ErrorData.message}
      show={ErrorData.show}
      timeout={3}
      exit={() => setErrorData(o => ({ ...o, show: false }))}
    />

    <div className="flex flex-col gap-y-2">
      <div className="mx-1 flex flex-col gap-y-2">
        <h1 className="text-xl font-medium"><T keyName="loginTitle" /></h1>
        {
          LoginData.showCodeInput ? (<>
            <div className="flex justify-between">
              {
                (new Array(6)).fill(0).map((_, i) => (
                  <input
                    key={i}
                    type="number"
                    className={`
                    w-12 h-12 bg-white/5 rounded-lg
                    text-center text-white text-2xl font-medium transition-all
                    focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
                    focus:ring-2 focus:ring-white/20 outline-none
                  `}
                    min={0}
                    disabled={Loading}
                    value={LoginData.otp?.[i] || ""}
                    max={9}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace") {
                        if (!e.target.value) {
                          const previousSibling = e.target.previousSibling;
                          if (previousSibling) {
                            previousSibling.focus();
                          }
                        }
                        setLoginData({
                          ...LoginData,
                          otp: [
                            ...LoginData.otp.slice(0, i),
                            "",
                            ...LoginData.otp.slice(i + 1)
                          ]
                        });
                      } else if (e.key === "ArrowLeft") {
                        const previousSibling = e.target.previousSibling;
                        if (previousSibling) {
                          previousSibling.focus();
                        }
                      } else if (e.key === "ArrowRight") {
                        const nextSibling = e.target.nextSibling;
                        if (nextSibling) {
                          nextSibling.focus();
                        }
                      } else if (!Number.isNaN(Number(e.key))) {
                        const nextSibling = e.target.nextSibling;
                        if (nextSibling) {
                          nextSibling.focus();
                        } else {
                          e.target.blur();
                          setTimeout(() => {
                            verifyOtpButtonRef.current.focus();
                          }, 100);
                        }

                        setLoginData({
                          ...LoginData,
                          otp: [
                            ...LoginData.otp.slice(0, i),
                            e.key,
                            ...LoginData.otp.slice(i + 1)
                          ]
                        });
                      }
                    }}
                    onPaste={(e) => {
                      e.stopPropagation();
                      e.preventDefault();

                      let clipboardData = e?.clipboardData || window?.clipboardData;
                      let pastedData = clipboardData.getData("Text").trim();

                      if (pastedData && pastedData.length !== 6) return;
                      if (pastedData && pastedData.match(/^[0-9]+$/) === null) return;

                      setLoginData({
                        ...LoginData,
                        otp: pastedData.split("")
                      });
                    }}
                  />
                ))
              }
            </div>

            <button
              ref={verifyOtpButtonRef}
              className={`
              px-4 py-2 bg-white/5 rounded-lg transition-all
              disabled:opacity-50 disabled:cursor-not-allowed mt-2
              focus:ring-2 focus:ring-white/20 outline-none
            `}
              disabled={LoginData.otp.join("")?.length !== 6 || Loading}
              onClick={verifyOTP}
            >
              {Loading ? <T keyName={"loading"} /> : <T keyName={"verifyOTP"} />}
            </button>
          </>) : (<>
            <PhoneInput
              placeholder={t("enterPhoneNumber")}
              value={LoginData.phoneNumber}
              disabled={Loading}
              onChange={(v) => {
                setLoginData({
                  ...LoginData,
                  phoneNumber: v,
                });
              }}
              addInternationalOption={false}
              defaultCountry="IT"
              className="flex px-4 py-2 bg-white/5 rounded-lg"
              numberInputProps={{
                className: "w-full bg-transparent ml-2 focus:outline-none text-white placeholder-white/50"
              }}
            />

            <button
              className={`
              px-4 py-2 bg-white/5 rounded-lg transition-all
              disabled:opacity-50 disabled:cursor-not-allowed mt-2
              focus:ring-2 focus:ring-white/20 outline-none
            `}
              disabled={!isValidPhoneNumber(LoginData.phoneNumber || "") || Loading}
              onClick={requestOTP}
            >
                {Loading ? <T keyName={"loading"} /> : <T keyName={"sendOTP"} />}
            </button>
          </>)
        }
      </div>

      <h2 className="text-xl font-bold mt-4">
        <T keyName={"whatBeunblurred"} />
      </h2>

      <p className="text-white/75">
        <T keyName={"whatBeunblurredDesc"} />
      </p>
      <p className="text-white/75 font-bold">
        <T keyName={"noAffliliation"} />
      </p>

      <h2 className="text-xl font-bold mt-4">
        <T keyName={"whyLogin"} />
      </h2>
      <p className="text-white/75">
        <T keyName={"whyLoginDesc"} />
      </p>
      <p className="text-white/75">
        <T
          keyName={"whyLoginDesc2"}
        />
      </p>

      <h2 className="text-xl font-bold mt-4">
        <T keyName={"foundABug"} />
      </h2>
      <p className="text-white/75">
        <T keyName={"foundABugDesc"} />
      </p>

      <h2 className="text-xl font-bold mt-4">
        <T keyName={"newFeature"} />
      </h2>
      <p className="text-white/75">
        <T keyName={"newFeatureDesc"} />
      </p>
    </div>
  </>);
}

export async function getServerSideProps({ req, res }) {
  const requiredCookies = [
    "token",
    "refreshToken",
    "tokenType",
    "tokenExpiration"
  ];

  if (!requiredCookies.map(n => hasCookie(n, { req, res })).includes(false)) {
    return {
      redirect: {
        destination: "/feed",
        permanent: false
      }
    };
  }

  return { props: {} };
}