export type UserCredentialType = {
  name: string;
  email: string;
  password: string;
  role: string;
  timeZone: string;
  schedule: {
    start: FirebaseFirestore.Timestamp;
    end: FirebaseFirestore.Timestamp;
  };
};

export type UserSafeCredentialType = {
  name: string;
  email: string;
  role: string;
  timeZone: string;
  schedule: {
    start: string;
    end: string;
  };
};

export type LoginCredentialType = {
  email: string;
  password: string;
};
