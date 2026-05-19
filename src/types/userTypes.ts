export type RegisterCredentialType = {
  name: string;
  email: string;
  password: string;
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
