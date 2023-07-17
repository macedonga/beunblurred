import { useRouter } from "next/router";
import { useState } from "react";
import { hasCookie } from "cookies-next";

import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function Login() {
  const router = useRouter();

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

    if (res.status !== 200) return alert("Internal server error");

    const data = await res.json();
    if (!data.success) return alert(data.error);

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

    if (res.status !== 200) return alert("Internal server error");

    const data = await res.json();
    if (!data.success) return alert(data.error);

    router.push("/feed");
  };

  const verifyOTP = async () => {
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
                    text-center text-white text-2xl font-medium
                    focus:outline-none
                  `}
                  min={0}
                  value={LoginData.otp?.[i] || ""}
                  max={9}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length === 1) {
                      const nextSibling = e.target.nextSibling;
                      if (nextSibling) {
                        nextSibling.focus();
                      }
                    } else {
                      const previousSibling = e.target.previousSibling;
                      if (previousSibling) {
                        previousSibling.focus();
                      }
                    }

                    setLoginData({
                      ...LoginData,
                      otp: [
                        ...LoginData.otp.slice(0, i),
                        value,
                        ...LoginData.otp.slice(i + 1)
                      ]
                    })
                  }}
                />
              ))
            }
          </div>

          <button
            className={`
              px-4 py-2 bg-white/5 rounded-lg transition-all
              disabled:opacity-50 disabled:cursor-not-allowed mt-2
            `}
            disabled={LoginData.otp.join("")?.length !== 6}
            onClick={verifyOTP}
          >
            Verify code
          </button>
        </>) : (<>
          <PhoneInput
            placeholder="Enter a phone number"
            value={LoginData.phoneNumber}
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
            `}
            disabled={!isValidPhoneNumber(LoginData.phoneNumber || "")}
            onClick={requestOTP}
          >
            Send code
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