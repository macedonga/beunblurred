import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { hasCookie } from "cookies-next";

import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function Login() {
  const router = useRouter();

  const verifyOtpButtonRef = useRef(null);
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

  const requestVonage = async () => {
    const res = await fetch("/api/vonage/send", {
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
      type: "vonage"
    };
  };

  const requestOTP = async () => {
    setLoading(true);
    if (!isValidPhoneNumber(LoginData.phoneNumber)) return alert("Invalid phone number");

    try {
      const data = await requestVonage();

      setLoginData({
        ...LoginData,
        showCodeInput: true,
        requestId: data.requestId,
        type: data.type
      });
    } catch {
      const data = await requestFire();

      setLoginData({
        ...LoginData,
        showCodeInput: true,
        requestId: data.requestId,
        type: data.type
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

    if (res.status !== 200) {
      setLoading(false);
      return alert("Internal server error");
    }

    const data = await res.json();
    if (!data.success) {
      setLoading(false);
      return alert(data.error);
    }

    router.push("/feed");
  };

  const verifyVonage = async () => {
    const res = await fetch("/api/vonage/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        otp: LoginData.otp.join(""),
        requestId: LoginData.requestId
      })
    });

    if (res.status !== 200) {
      setLoading(false);
      return alert("Internal server error");
    }

    const data = await res.json();
    if (!data.success) {
      setLoading(false);
      return alert(data.error);
    }

    router.push("/feed");
  };

  const verifyOTP = async () => {
    setLoading(true);

    if (LoginData.type === "fire") {
      verifyFire();
    } else {
      verifyVonage();
    }
  };

  return (
    <div className="flex flex-col gap-y-2">
      <h1 className="text-xl font-medium">Login with your phone number</h1>

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
                      setLoginData({
                        ...LoginData,
                        otp: [
                          ...LoginData.otp.slice(0, i),
                          "",
                          ...LoginData.otp.slice(i + 1)
                        ]
                      });

                      const previousSibling = e.target.previousSibling;
                      if (previousSibling) {
                        previousSibling.focus();
                      }
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
                    } else if (!isNaN(Number(e.key))) {
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
            {Loading ? "Loading..." : "Verify code"}
          </button>
        </>) : (<>
          <PhoneInput
            placeholder="Enter a phone number"
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
            {Loading ? "Loading..." : "Send code"}
          </button>
        </>)
      }
    </div>
  )
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