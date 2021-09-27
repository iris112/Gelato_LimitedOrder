import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import FormCard from "./";
import { act } from "react-dom/test-utils";

describe("form", (): void => {
  const promise = Promise.resolve();
  
  beforeEach(async (): Promise<void> => {
    cleanup();
    await act(() => promise)
  });

  it("enable submit button", async (): Promise<void> => {
    render(<FormCard />);
    await act(() => promise)
    
    let firstAmount = screen.getByTestId("first-amount").querySelector('input') as HTMLInputElement;
    let price = screen.getByTestId("price").querySelector('input') as HTMLInputElement;
    let secondAmount = screen.getByTestId("second-amount") as HTMLHeadingElement;
    let submit = screen.getByTestId("submit") as HTMLButtonElement;

    fireEvent.change(firstAmount, { target: { value: '10' } });
    fireEvent.change(price, { target: { value: '5' } });
    await act(() => promise)

    expect(submit.classList.contains('Mui-disabled')).toBe(false);
    expect(secondAmount.textContent).toBe("Amount: 50");   
  });
});