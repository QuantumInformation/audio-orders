import {
  domains,
  OrderSelector,
  OrderSelectorNotificationSize
} from "./definitions/domains";

export class AudioOrders {
  /**
   * @param config you can override this
   */

  constructor() {
    const currentHref = window.location.href;
    const currentOrderSelector = domains.get(currentHref);
    if (currentOrderSelector) {
      console.log(
        `Found ${currentOrderSelector.orderSelector.name} for currency ${
          currentOrderSelector.CurrencyInfo
        }, happy listening!`
      );

      if (
        document.querySelector(
          currentOrderSelector.orderSelector.orderTableSelector
        )
      ) {
        this.addObserverForTrades(currentOrderSelector); // already on page before extension loads
      } else {
        elementReady(currentOrderSelector.orderSelector.orderTableSelector)
          .then(element => {
            this.addObserverForTrades(currentOrderSelector);
          })
          .catch(console.error.bind(console));
      }
    } else if (window.location.hostname === "www.etoro.com") {
    } else {
      console.log("no trades to be monitored");
    }

    console.log(
      `Your orders to be notified of are above ${
        currentOrderSelector.NotificationSize.big
      } (big order) and ${currentOrderSelector.NotificationSize.normal} `
    );
  }

  addObserverForTrades(
    orderSelectorNotificationSize: OrderSelectorNotificationSize
  ) {
    let targetElement = document.querySelector(
      orderSelectorNotificationSize.orderSelector.orderTableSelector
    );
    let observer = new MutationObserver(mutations => {
      mutations.forEach((mutationRecord: MutationRecord) => {
        switch (mutationRecord.type) {
          case "characterData":
            let target = mutationRecord.target as HTMLElement;

            if (!target.parentElement.id) {
              return;
            }
            return;
          case "childList":
            if (mutationRecord.addedNodes.length) {
              const addedRow = mutationRecord.addedNodes[0] as HTMLElement;
              const newOrder = Number(
                addedRow.querySelector(".col-currency").textContent
              );
              const isBuy = !!addedRow.querySelector(".fa-chevron-up");

              if (
                newOrder >= orderSelectorNotificationSize.NotificationSize.big
              ) {
                new Audio(
                  chrome.runtime.getURL(
                    isBuy ? "audio/very_good.mp3" : "audio/very_bad.mp3"
                  )
                ).play();
              } else if (
                newOrder >=
                orderSelectorNotificationSize.NotificationSize.normal
              ) {
                new Audio(
                  chrome.runtime.getURL(
                    isBuy ? "audio/good.mp3" : "audio/bad.mp3"
                  )
                ).play();
              }
            }
            return;
          default:
            console.log(`something went wrong`);
        }
      });
    });
    let config = {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    };

    observer.observe(targetElement, config);
  }
}

new AudioOrders();

/**
 * Waits for an element satisfying selector to exist, then resolves promise with the element.
 * Useful for resolving race conditions.
 *
 * @param selector
 * @returns {Promise}
 */
export function elementReady(selector) {
  return new Promise((resolve, reject) => {
    let el = document.querySelector(selector);
    if (el) {
      resolve(el);
    }
    new MutationObserver((mutationRecords, observer) => {
      // Query for elements matching the specified selector
      Array.from(document.querySelectorAll(selector)).forEach(element => {
        resolve(element);
        //Once we have resolved we don't need the observer anymore.
        observer.disconnect();
      });
    }).observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  });
}
