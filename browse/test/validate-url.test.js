import { describe, it, expect } from 'vitest';
import { validateUrl } from '../src/commands.js';

describe('validateUrl', () => {
  // --- 正常系 ---
  it('https URL を許可する', () => {
    expect(() => validateUrl('https://example.com')).not.toThrow();
  });

  it('http URL を許可する', () => {
    expect(() => validateUrl('http://example.com/path?q=1')).not.toThrow();
  });

  it('ポート付き URL を許可する', () => {
    expect(() => validateUrl('http://example.com:8080')).not.toThrow();
  });

  // --- プロトコル拒否 ---
  it('file: プロトコルを拒否する', () => {
    expect(() => validateUrl('file:///etc/passwd')).toThrow('Protocol not allowed');
  });

  it('javascript: プロトコルを拒否する', () => {
    expect(() => validateUrl('javascript:alert(1)')).toThrow('Protocol not allowed');
  });

  it('data: プロトコルを拒否する', () => {
    expect(() => validateUrl('data:text/html,<h1>Hi</h1>')).toThrow('Protocol not allowed');
  });

  it('ftp: プロトコルを拒否する', () => {
    expect(() => validateUrl('ftp://files.example.com')).toThrow('Protocol not allowed');
  });

  // --- 内部ネットワーク拒否 ---
  it('127.0.0.1 (loopback) を拒否する', () => {
    expect(() => validateUrl('http://127.0.0.1')).toThrow('Internal network access not allowed');
  });

  it('127.x.x.x を拒否する', () => {
    expect(() => validateUrl('http://127.255.0.1')).toThrow('Internal network access not allowed');
  });

  it('10.x.x.x (RFC1918) を拒否する', () => {
    expect(() => validateUrl('http://10.0.0.1')).toThrow('Internal network access not allowed');
  });

  it('172.16.x.x (RFC1918) を拒否する', () => {
    expect(() => validateUrl('http://172.16.0.1')).toThrow('Internal network access not allowed');
  });

  it('172.31.x.x (RFC1918 上限) を拒否する', () => {
    expect(() => validateUrl('http://172.31.255.255')).toThrow('Internal network access not allowed');
  });

  it('172.15.x.x は許可する（RFC1918 範囲外）', () => {
    expect(() => validateUrl('http://172.15.0.1')).not.toThrow();
  });

  it('172.32.x.x は許可する（RFC1918 範囲外）', () => {
    expect(() => validateUrl('http://172.32.0.1')).not.toThrow();
  });

  it('192.168.x.x (RFC1918) を拒否する', () => {
    expect(() => validateUrl('http://192.168.1.1')).toThrow('Internal network access not allowed');
  });

  it('169.254.169.254 (AWS metadata) を拒否する', () => {
    expect(() => validateUrl('http://169.254.169.254/latest/meta-data/')).toThrow('Internal network access not allowed');
  });

  it('0.0.0.0 を拒否する', () => {
    expect(() => validateUrl('http://0.0.0.0')).toThrow('Internal network access not allowed');
  });

  // --- クラウドメタデータホスト名 ---
  it('metadata.google.internal を拒否する', () => {
    expect(() => validateUrl('http://metadata.google.internal/computeMetadata/v1/')).toThrow('Hostname not allowed');
  });

  // --- IPv6 ---
  it('::1 (IPv6 loopback) を拒否する', () => {
    expect(() => validateUrl('http://[::1]')).toThrow('Internal network access not allowed');
  });

  // --- 不正な URL ---
  it('不正な URL で例外を投げる', () => {
    expect(() => validateUrl('not-a-url')).toThrow();
  });
});
