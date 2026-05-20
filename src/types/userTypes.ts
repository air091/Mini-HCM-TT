export type UserCredentialType = {
  name: string;
  email: string;
  password: string;
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
