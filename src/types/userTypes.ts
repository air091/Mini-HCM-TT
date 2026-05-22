export type UserCredentialType = {
  name: string;
  email: string;
  password: string;
  role: string;
  timeZone: string;
  schedule: {
    start: string | Date;
    end: string | Date;
  };
};

export type UserSafeCredentialType = {
  name: string;
  email: string;
  role: string;
  timeZone: string;
  schedule: {
    start: string | Date;
    end: string | Date;
  };
};

export type LoginCredentialType = {
  email: string;
  password: string;
};
