import { ReactNode, useRef, useState, useSyncExternalStore } from "react";

import ExternalLink from "replay-next/components/ExternalLink";
import Icon from "replay-next/components/Icon";
import useModalDismissSignal from "replay-next/src/hooks/useModalDismissSignal";
import { ReplayClientInterface } from "shared/client/types";
import { getRecordingId } from "shared/utils/recording";

import styles from "./SupportForm.module.css";

export function SupportForm({
  currentUserEmail,
  currentUserId,
  currentUserName,
  details,
  onDismiss,
  replayClient,
  title = "Support",
}: {
  currentUserEmail: string | null;
  currentUserId: string | null;
  currentUserName: string | null;
  details?: ReactNode;
  onDismiss?: () => void;
  replayClient: ReplayClientInterface;
  title?: ReactNode;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  const [showConfirmationPrompt, setShowConfirmationPrompt] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<null | "failure" | "success">(null);
  const [text, setText] = useState("");

  const sessionId = useSyncExternalStore(
    (change: () => void) => {
      replayClient.addEventListener("sessionCreated", change);
      return () => {
        replayClient.removeEventListener("sessionCreated", change);
      };
    },
    replayClient.getSessionId,
    replayClient.getSessionId
  );

  const confirmClose = () => {
    if (text) {
      setShowConfirmationPrompt(true);
    } else if (onDismiss) {
      onDismiss();
    }
  };

  useModalDismissSignal(modalRef, onDismiss ? confirmClose : noop, true);

  if (showConfirmationPrompt) {
    const dismiss = () => {
      setShowConfirmationPrompt(false);
    };
    const confirm = () => {
      if (onDismiss) {
        onDismiss();
      }
      setShowConfirmationPrompt(false);
    };

    return (
      <div className={styles.Background}>
        <div className={styles.Modal} data-confirmation>
          <div className={styles.Header}>Cancel support request?</div>
          <div>You started writing a message, cancel it?</div>
          <div className={styles.Footer} data-confirmation>
            <button className={styles.FooterButton} color="blue" onClick={dismiss}>
              No
            </button>
            <button className={styles.FooterButton} color="pink" onClick={confirm}>
              Yes, delete it
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    const closeIfEmpty = () => {
      if (onDismiss && !text) {
        onDismiss();
      }
    };

    const submit = async () => {
      if (text) {
        try {
          const result = await fetch("/api/feedback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            // FormCarry does not support nested values
            body: JSON.stringify({
              date: new Date(),
              recordingId: getRecordingId(),
              sessionId,
              text,
              url: window.location.href,
              userAgent: navigator.userAgent,
              userEmail: currentUserEmail,
              userId: currentUserId,
              userName: currentUserName,
            }),
          });

          if (result.status >= 400) {
            const text = await result.text();

            throw Error(text);
          }

          setSubmitStatus("success");
        } catch (error) {
          setSubmitStatus("failure");
        } finally {
          setText("");
        }
      }
    };

    let confirmationMessage = null;
    switch (submitStatus) {
      case "failure":
        confirmationMessage = "Something went wrong. Please reload the page and try again.";
        break;
      case "success":
        if (currentUserEmail) {
          confirmationMessage = `Thank you for your note. We'll get back to you at ${currentUserEmail} as soon as possible.`;
        } else {
          confirmationMessage = "Thank you for your note.";
        }
        break;
    }

    return (
      <div className={styles.Background}>
        <div className={styles.Modal} ref={modalRef} data-test-id="SupportForm">
          <div className={styles.Header}>
            <div>{title}</div>
            {onDismiss && (
              <button className={styles.CloseButton} onClick={confirmClose}>
                <Icon className={styles.CloseButtonIcon} type="close" />
              </button>
            )}
          </div>
          {details}
          {confirmationMessage ? (
            <div className={styles.ConfirmationMessage}>{confirmationMessage}</div>
          ) : (
            <>
              <textarea
                autoFocus
                className={styles.TextArea}
                onChange={event => setText(event.target.value)}
                placeholder="Bugs, suggestions, questions are all welcome!"
                value={text}
              />
              <div className={styles.FormActions}>
                <button
                  className={styles.SubmitButton}
                  color="blue"
                  disabled={!text}
                  onClick={submit}
                >
                  Submit
                </button>
              </div>
              <hr className={styles.HorizontalRule} />
            </>
          )}
          <ExternalLink
            className={styles.Footer}
            href="https://discord.gg/n2dTK6kcRX"
            onClick={closeIfEmpty}
          >
            <svg
              width="12"
              height="10"
              viewBox="0 0 12 10"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.FooterIcon}
            >
              <path d="M10.1652 0.901328C9.37675 0.540373 8.54443 0.284299 7.68947 0.139648C7.57247 0.348793 7.46662 0.563974 7.37234 0.784292C6.46164 0.647059 5.53551 0.647059 4.62481 0.784292C4.53049 0.563997 4.42463 0.348818 4.30768 0.139648C3.45217 0.285521 2.61931 0.542203 1.8301 0.903216C0.263323 3.22129 -0.161406 5.48179 0.0509584 7.7102C0.968502 8.38812 1.9955 8.90369 3.0873 9.2345C3.33314 8.90386 3.55068 8.55308 3.7376 8.1859C3.38256 8.05329 3.03988 7.88969 2.71354 7.69699C2.79942 7.63469 2.88343 7.57051 2.9646 7.50822C3.91419 7.95479 4.95063 8.18633 5.99999 8.18633C7.04935 8.18633 8.08579 7.95479 9.03539 7.50822C9.1175 7.57523 9.2015 7.63941 9.28645 7.69699C8.95947 7.89 8.61616 8.05392 8.26049 8.18684C8.44719 8.55385 8.66474 8.90434 8.9108 9.2345C10.0035 8.90502 11.0313 8.38969 11.949 7.71114C12.1982 5.12691 11.5234 2.88717 10.1652 0.901328ZM4.0066 6.33974C3.41481 6.33974 2.9259 5.8027 2.9259 5.14201C2.9259 4.48132 3.39782 3.93955 4.00471 3.93955C4.6116 3.93955 5.09674 4.48132 5.08635 5.14201C5.07597 5.8027 4.60971 6.33974 4.0066 6.33974ZM7.99338 6.33974C7.40065 6.33974 6.91363 5.8027 6.91363 5.14201C6.91363 4.48132 7.38555 3.93955 7.99338 3.93955C8.60122 3.93955 9.08258 4.48132 9.0722 5.14201C9.06181 5.8027 8.5965 6.33974 7.99338 6.33974Z" />
            </svg>
            <div>Chat with us on Discord</div>
          </ExternalLink>

          <ExternalLink
            className={styles.Footer}
            href="mailto:support@replay.io"
            onClick={closeIfEmpty}
          >
            <svg
              width="12"
              height="10"
              viewBox="0 0 12 10"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.FooterIcon}
            >
              <path d="M2.41731 3.08641C2.31552 3.08641 2.23071 3.05249 2.16285 2.98463C2.09839 2.91338 2.06616 2.82687 2.06616 2.72509C2.06616 2.6267 2.09839 2.54358 2.16285 2.47572C2.23071 2.40787 2.31552 2.37394 2.41731 2.37394H5.69975C5.79814 2.37394 5.88126 2.40787 5.94912 2.47572C6.02036 2.54358 6.05598 2.6267 6.05598 2.72509C6.05598 2.82687 6.02036 2.91338 5.94912 2.98463C5.88126 3.05249 5.79814 3.08641 5.69975 3.08641H2.41731ZM2.41731 4.4452C2.31552 4.4452 2.23071 4.41127 2.16285 4.34341C2.09839 4.27217 2.06616 4.18735 2.06616 4.08896C2.06616 3.99057 2.09839 3.90745 2.16285 3.8396C2.23071 3.76835 2.31552 3.73273 2.41731 3.73273H4.81934C4.91773 3.73273 5.00085 3.76835 5.06871 3.8396C5.13995 3.90745 5.17558 3.99057 5.17558 4.08896C5.17558 4.18735 5.13995 4.27217 5.06871 4.34341C5.00085 4.41127 4.91773 4.4452 4.81934 4.4452H2.41731ZM8.71759 4.5826C8.49366 4.5826 8.28842 4.52832 8.10178 4.41975C7.91859 4.30779 7.771 4.16021 7.65904 3.977C7.55048 3.7904 7.49619 3.58514 7.49619 3.36123C7.49619 3.1373 7.55048 2.93374 7.65904 2.75054C7.771 2.56394 7.91859 2.41636 8.10178 2.30779C8.28842 2.19583 8.49366 2.13985 8.71759 2.13985C8.94151 2.13985 9.14506 2.19583 9.32826 2.30779C9.51145 2.41636 9.65737 2.56394 9.76592 2.75054C9.87784 2.93374 9.93388 3.1373 9.93388 3.36123C9.93388 3.58514 9.87784 3.7904 9.76592 3.977C9.65737 4.16021 9.51145 4.30779 9.32826 4.41975C9.14506 4.52832 8.94151 4.5826 8.71759 4.5826ZM1.59796 9.37138C1.06531 9.37138 0.664972 9.2391 0.396948 8.97445C0.132316 8.71325 0 8.32137 0 7.79888V1.58005C0 1.05418 0.132316 0.66063 0.396948 0.399388C0.664972 0.134757 1.06531 0.00244141 1.59796 0.00244141H10.402C10.9381 0.00244141 11.3384 0.134757 11.6031 0.399388C11.8677 0.664021 12 1.05757 12 1.58005V7.79888C12 8.32137 11.8677 8.71325 11.6031 8.97445C11.3384 9.2391 10.9381 9.37138 10.402 9.37138H1.59796ZM1.60815 8.5521H10.3919C10.6429 8.5521 10.8363 8.48588 10.972 8.3536C11.1111 8.21786 11.1806 8.01775 11.1806 7.75311V1.62586C11.1806 1.36122 11.1111 1.16105 10.972 1.02534C10.8363 0.889634 10.6429 0.821784 10.3919 0.821784H1.60815C1.35369 0.821784 1.15861 0.889634 1.0229 1.02534C0.887196 1.16105 0.819338 1.36122 0.819338 1.62586V7.75311C0.819338 8.01775 0.887196 8.21786 1.0229 8.3536C1.15861 8.48588 1.35369 8.5521 1.60815 8.5521Z" />
            </svg>
            <div>Send us an email</div>
          </ExternalLink>
        </div>
      </div>
    );
  }
}

function noop() {}
