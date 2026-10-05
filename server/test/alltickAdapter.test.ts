import { describe, it, expect, vi } from 'vitest';
import { AllTickAdapter } from '../src/market/alltickAdapter.js';

describe('AllTick Real-Time Forex & Crypto Market Feed Adapter', () => {
  it('should initialize with provided token or fallback to environment variable', () => {
    const adapter1 = new AllTickAdapter('custom_token_123');
    expect(adapter1.getToken()).toBe('custom_token_123');

    const adapter2 = new AllTickAdapter();
    expect(adapter2.getToken()).toBe(process.env.ALLTICK_API_TOKEN || '4554c41c6fc5298fb839ca4530639663-c-app');
  });

  it('should allow updating token dynamically', () => {
    const adapter = new AllTickAdapter();
    adapter.setToken('new_applied_token_889');
    expect(adapter.getToken()).toBe('new_applied_token_889');
  });

  it('should return error on REST quote fetch if no token is configured', async () => {
    const adapter = new AllTickAdapter('');
    const result = await adapter.fetchLatestQuotes(['EURUSD']);
    expect(result.success).toBe(false);
    expect(result.error).toContain('token is required');
  });

  it('should generate continuous synthetic candlestick bars as fallback', () => {
    const adapter = new AllTickAdapter('');
    const bars = adapter.generateSyntheticCandles('USDJPY', '1m', 20);
    expect(bars.length).toBe(20);
    expect(bars[0].open).toBeGreaterThan(0);
    expect(bars[0].high).toBeGreaterThanOrEqual(bars[0].low);
  });

  it('should update active candlestick bar in real-time when tick arrives', () => {
    const adapter = new AllTickAdapter('test_token');
    const onCandleSpy = vi.fn();
    adapter.onCandleUpdate(onCandleSpy);

    const now = Date.now();
    adapter.updateCandleWithTick('USDJPY', 158.050, now);
    adapter.updateCandleWithTick('USDJPY', 158.090, now + 500);

    expect(onCandleSpy).toHaveBeenCalled();
  });

  it('should parse and dispatch incoming WebSocket tick messages (Protocol 22998)', () => {
    const adapter = new AllTickAdapter('test_token');
    const onTickSpy = vi.fn();
    adapter.onTick(onTickSpy);

    const mockTickPush = JSON.stringify({
      cmd_id: 22998,
      data: {
        code: 'EURUSD',
        seq: 1605509068000001,
        tick_time: 1605509068,
        price: '1.12450',
        volume: '150',
        turnover: '168.67',
        trade_direction: 1,
      },
    });

    adapter.handleMessage(mockTickPush);

    expect(onTickSpy).toHaveBeenCalledTimes(1);
    expect(onTickSpy).toHaveBeenCalledWith('EURUSD', 1.1245, 1605509068);
  });

  it('should ignore non-tick push messages without crashing', () => {
    const adapter = new AllTickAdapter('test_token');
    const onTickSpy = vi.fn();
    adapter.onTick(onTickSpy);

    // Heartbeat reply (Protocol 22001) or sub reply (22005)
    const mockHeartbeatReply = JSON.stringify({
      ret: 200,
      msg: 'ok',
      cmd_id: 22001,
      seq_id: 123,
      trace: 'trace_test',
    });

    adapter.handleMessage(mockHeartbeatReply);
    expect(onTickSpy).not.toHaveBeenCalled();
  });

  it('should map symbols correctly with toAllTickCode and fromAllTickCode', () => {
    expect(AllTickAdapter.toAllTickCode('XAUUSD')).toBe('GOLD');
    expect(AllTickAdapter.toAllTickCode('GOLD')).toBe('GOLD');
    expect(AllTickAdapter.fromAllTickCode('GOLD')).toBe('XAUUSD');

    expect(AllTickAdapter.toAllTickCode('MCL1!')).toBe('USOIL');
    expect(AllTickAdapter.toAllTickCode('USOIL')).toBe('USOIL');
    expect(AllTickAdapter.toAllTickCode('OIL')).toBe('USOIL');
    expect(AllTickAdapter.fromAllTickCode('USOIL')).toBe('MCL1!');

    expect(AllTickAdapter.toAllTickCode('EURUSD')).toBe('EURUSD');
    expect(AllTickAdapter.fromAllTickCode('EURUSD')).toBe('EURUSD');

    expect(AllTickAdapter.toAllTickCode('AUDUSD')).toBe('AUDUSD');
    expect(AllTickAdapter.fromAllTickCode('AUDUSD')).toBe('AUDUSD');

    expect(AllTickAdapter.toAllTickCode('USDCAD')).toBe('USDCAD');
    expect(AllTickAdapter.fromAllTickCode('USDCAD')).toBe('USDCAD');
  });

  it('should gracefully clean up on disconnect', () => {
    const adapter = new AllTickAdapter('test_token');
    adapter.disconnect();
    expect(adapter.getIsConnected()).toBe(false);
  });
});

