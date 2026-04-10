export type RootStackParamList = {
  Tabs: undefined;
  SessionSetup: { dhikrId: string };
  Session: { dhikrId: string; targetCount: number };
  Summary: { sessionId: string };
  Chart: undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Settings: undefined;
};
