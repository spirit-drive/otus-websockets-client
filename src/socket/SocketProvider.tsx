import React, { FC, createContext, useEffect, useState, useContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { URL } from 'src/client/config';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'src/store';
import { tokenSelectors } from 'src/store/token';
import { usersActions } from 'src/store/users';
import { messagesActions } from 'src/store/messages';

export type SocketProviderProps = {
  children: React.ReactNode;
};

export type SocketError = Error & { data: string };

export type SocketContextType = {
  socket: Socket;
  error: SocketError;
};

const SocketContext = createContext<SocketContextType>({} as SocketContextType);

export const useSocketContext = () => useContext(SocketContext);

export const SocketProvider: FC<SocketProviderProps> = ({ children }) => {
  const [data, setData] = useState<SocketContextType>({ socket: null, error: null });
  const dispatch = useDispatch();
  const token = useSelector<RootState, RootState['token']>(tokenSelectors.get);

  useEffect(() => {
    const _socket = io(URL, { auth: { token } });

    _socket.on('connect', () => {
      setData({ socket: _socket, error: null });
    });

    _socket.on('disconnect', () => {
      setData({ socket: null, error: null });
    });

    _socket.on('connect_error', (error: SocketError) => {
      setData({ socket: _socket, error });
    });

    _socket.on('users', (users) => {
      dispatch(usersActions.set(users));
    });

    _socket.on('messages', (messages) => {
      dispatch(messagesActions.set(messages));
    });

    return () => {
      setData(null);
      _socket.disconnect();
    };
  }, [dispatch, token]);

  return <SocketContext.Provider value={data}>{children}</SocketContext.Provider>;
};
