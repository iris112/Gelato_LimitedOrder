import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import { act } from "react-dom/test-utils";

describe("form", (): void => {
  const promise = Promise.resolve();
  let firstAmount: HTMLInputElement;
  let price: HTMLInputElement;

  beforeEach(async (): Promise<void> => {
    render(<App />);
    await act(() => promise)

    firstAmount = screen.getByTestId("first-amount").querySelector('input') as HTMLInputElement;
    price = screen.getByTestId("price").querySelector('input') as HTMLInputElement;
  });

  it("renders default state", (): void => {    
    expect(firstAmount.value).toBe("");
    expect(price.value).toBe("");
  });

  it("changing name field", async (): Promise<void> => {
    // Amount
    fireEvent.change(firstAmount, { target: { value: 'abc' } });
    await act(() => promise)

    expect(firstAmount.value).toBe("");   

    fireEvent.change(firstAmount, { target: { value: '12' } });
    await act(() => promise)

    expect(firstAmount.value).toBe("12");   

    // Price
    fireEvent.change(price, { target: { value: 'abc' } });
    await act(() => promise)

    expect(price.value).toBe("");

    fireEvent.change(price, { target: { value: '1.5' } });
    await act(() => promise)

    expect(price.value).toBe("1.5");   
  });
});