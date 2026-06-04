import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleSignInButton } from './google-sign-in-button';

type ResizeObserverCallbackArg = Parameters<ResizeObserverCallback>[0];
type GoogleAccountsId = NonNullable<NonNullable<Window['google']>['accounts']>['id'];

describe('GoogleSignInButton', () => {
  let initialize: ReturnType<typeof vi.fn<GoogleAccountsId['initialize']>>;
  let renderButton: ReturnType<typeof vi.fn<GoogleAccountsId['renderButton']>>;
  let resizeCallback: ResizeObserverCallback | undefined;

  beforeEach(() => {
    initialize = vi.fn<GoogleAccountsId['initialize']>();
    renderButton = vi.fn<GoogleAccountsId['renderButton']>();
    resizeCallback = undefined;

    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallback = callback;
        }

        observe() {}

        disconnect() {}
      },
    );

    window.google = {
      accounts: {
        id: {
          initialize,
          renderButton,
        },
      },
    };
  });

  afterEach(() => {
    delete window.google;
    vi.unstubAllGlobals();
  });

  it('initializes Google Identity Services once across rerenders and resizes', async () => {
    const { rerender } = render(
      <GoogleSignInButton
        clientId="google-client-id"
        disabledLabel="Google unavailable"
        label="Continue with Google"
        loadingLabel="Signing in"
        locale="vi"
        onCredential={vi.fn()}
      />,
    );

    await waitFor(() => expect(initialize).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(renderButton).toHaveBeenCalledTimes(1));

    act(() => {
      const resizeEntries = [
        {
          contentRect: { width: 320 },
        },
      ] as ResizeObserverCallbackArg;
      resizeCallback?.(resizeEntries, {} as ResizeObserver);
    });

    await waitFor(() => expect(renderButton).toHaveBeenCalledTimes(2));
    expect(initialize).toHaveBeenCalledTimes(1);

    rerender(
      <GoogleSignInButton
        clientId="google-client-id"
        disabledLabel="Google unavailable"
        label="Continue with Google"
        loadingLabel="Signing in"
        locale="vi"
        onCredential={vi.fn()}
      />,
    );

    expect(initialize).toHaveBeenCalledTimes(1);
  });

  it('uses the disabled label when disabled without local loading', () => {
    render(
      <GoogleSignInButton
        clientId="google-client-id"
        disabled
        disabledLabel="Google unavailable"
        label="Continue with Google"
        loadingLabel="Signing in"
        onCredential={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', { name: 'Google unavailable' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
