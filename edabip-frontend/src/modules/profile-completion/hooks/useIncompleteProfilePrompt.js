import { useCallback, useEffect, useState } from "react";
import { isProfileComplete } from "../utils/profileCompleteness.js";
import {
  dismissProfilePrompt,
  wasProfilePromptDismissed,
} from "../utils/profilePromptStorage.js";

function shouldOpenPrompt(user) {
  return Boolean(
    user && !isProfileComplete(user) && !wasProfilePromptDismissed(user)
  );
}

export function useIncompleteProfilePrompt(user) {
  const [isOpen, setIsOpen] = useState(() => shouldOpenPrompt(user));

  useEffect(() => {
    if (!user) {
      setIsOpen(false);
      return;
    }

    if (wasProfilePromptDismissed(user) || isProfileComplete(user)) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
  }, [user]);

  const dismiss = useCallback(() => {
    dismissProfilePrompt(user);
    setIsOpen(false);
  }, [user]);

  return { isOpen, dismiss };
}
