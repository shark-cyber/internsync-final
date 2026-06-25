import { api } from "./api";
import { getIdToken, User } from "./firebase";

type SocialSignupOptions = {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  interests?: string[];
  jobPreferences?: {
    roles?: string[];
    types?: string[];
  };
  isPremium?: boolean;
};

export const splitDisplayName = (displayName?: string | null) => {
  const parts = (displayName || "").trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
};

const isMissingBackendUserError = (message: string) =>
  /user not found|complete otp verification first|requiresverification|unverified/i.test(
    message,
  );

export const syncOrCreateSocialUser = async (
  providerUser: User,
  options: SocialSignupOptions = {},
) => {
  if (!providerUser.email) {
    throw new Error("Your provider account did not return an email address.");
  }

  const idToken = await getIdToken(providerUser);

  try {
    await api.post("/v1/user/sync", {}, { Authorization: `Bearer ${idToken}` });
    return { created: false };
  } catch (error: any) {
    if (!isMissingBackendUserError(error?.message || "")) {
      throw error;
    }
  }

  const fallbackName = splitDisplayName(providerUser.displayName);

  try {
    await api.post(
      "/v1/auth/signup/finalize",
      {
        uid: providerUser.uid,
        email: providerUser.email,
        firstName: options.firstName ?? fallbackName.firstName,
        lastName: options.lastName ?? fallbackName.lastName,
        dateOfBirth: options.dateOfBirth,
        interests: options.interests ?? [],
        jobPreferences: {
          roles: options.jobPreferences?.roles ?? [],
          types: options.jobPreferences?.types ?? [],
        },
        isPremium: options.isPremium ?? false,
      },
      { Authorization: `Bearer ${idToken}` },
    );
  } catch (error: any) {
    if (!/user already exists/i.test(error?.message || "")) {
      throw error;
    }
  }

  return { created: true };
};
