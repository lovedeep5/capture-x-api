import jwt from "jsonwebtoken";
import axios from "axios";
import jwkToPem from "jwk-to-pem";

const CLERK_ISSUER = "https://rich-parrot-73.clerk.accounts.dev";
const JWKS_URL = `${CLERK_ISSUER}/.well-known/jwks.json`;
const pemCache = {};

async function getPem(kid) {
  if (pemCache[kid]) return pemCache[kid];

  const { data } = await axios.get(JWKS_URL);
  const jwk = data.keys.find((key) => key.kid === kid);

  if (!jwk) {
    throw new Error("JWK not found for given kid");
  }

  const pem = jwkToPem(jwk);
  pemCache[kid] = pem;
  return pem;
}

export async function verifyClerkJwt(req, res, next) {
  const token = req.body?.token;

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === "string") {
      return res.status(401).json({ message: "Invalid token structure" });
    }

    const pem = await getPem(decoded.header.kid);

    jwt.verify(
      token,
      pem,
      {
        algorithms: ["RS256"],
        issuer: CLERK_ISSUER,
      },
      (err, payload) => {
        if (err) {
          return res.status(401).json({ message: "Invalid token" });
        }

        req.user = payload;
        next();
      }
    );
  } catch (error) {
    console.error("JWT verification error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
}
