import { render, screen } from '@testing-library/react';

// Mock react-router-dom before importing App to avoid issues with
// react-router-dom v7 ESM in the Jest (CommonJS) environment.
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: () => null,
  Navigate: () => null,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => jest.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/' }),
}));

// Mock the API service so no real HTTP calls are made
jest.mock('./services/api', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
}));

import App from './App';

test('renders the app without crashing', () => {
  render(<App />);
});

test('shows login link when user is not authenticated', () => {
  render(<App />);
  // The Navbar renders Login/Register links when not authenticated.
  // Since localStorage is empty in test env, user is null → links appear.
  expect(screen.getByText(/login/i)).toBeInTheDocument();
});
