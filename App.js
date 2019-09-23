import React, {useState, useEffect} from 'react';
import {StyleSheet, View, Text, Button} from 'react-native';
import BluetoothSerial from 'react-native-bluetooth-serial';
import {ToastAndroid} from 'react-native';

const App = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isDevicePaired, setDeviceIsPaired] = useState(false);
  const [device, setDevice] = useState([]);
  const [connected, setConnected] = useState(false);
  const [devicePairedFound, setDevicePairedFound] = useState(false);
  const [deviceUnpairedFound, setDeviceUnpairedFound] = useState(false);
  const [dataFromDevice, setDataFromDevice] = useState(false);

  const pairDevice = device => {
    BluetoothSerial.pairDevice(device.id)
      .then(paired => {
        setDeviceIsPaired(true);
        if (paired) {
          ToastAndroid.show(
            `Device ${device.name} paired successfully`,
            ToastAndroid.SHORT,
          );
        } else {
          ToastAndroid.show(
            `Device ${device.name} pairing failed`,
            ToastAndroid.SHORT,
          );
        }
      })
      .catch(err => ToastAndroid.show(err.message));
  };

  const connect = device => {
    BluetoothSerial.connect(device.id)
      .then(res => {
        ToastAndroid.show(
          `Connected to device ${device.name}`,
          ToastAndroid.SHORT,
        );
        setConnected(true);
      })
      .catch(err => {
        setConnected(false);
        ToastAndroid.show(err.message, ToastAndroid.SHORT);
      });
  };

  const connectUnpaired = () => {
    if (deviceUnpairedFound && isDevicePaired) {
      BluetoothSerial.connect(device.id)
        .then(res => {
          ToastAndroid.show(
            `Connected to device ${device.name}`,
            ToastAndroid.SHORT,
          );
          setConnected(true);
        })
        .catch(err => {
          setConnected(false);
          ToastAndroid.show(err.message, ToastAndroid.SHORT);
        });
    }
  };

  const writeOn = () => {
    if (!connected) {
      ToastAndroid.show('You must connect to device first', ToastAndroid.SHORT);
    } else {
      BluetoothSerial.write('a')
        .then(res => {
          ToastAndroid.show(`Successfuly ON sent`, ToastAndroid.SHORT);
          setConnected(true);
        })
        .catch(err => ToastAndroid.show(err.message, ToastAndroid.SHORT));
    }
  };

  const writeOff = () => {
    if (!connected) {
      ToastAndroid.show('You must connect to device first', ToastAndroid.SHORT);
    } else {
      BluetoothSerial.write('b')
        .then(res => {
          ToastAndroid.show(`Successfuly OFF sent`, ToastAndroid.SHORT);
          setConnected(true);
        })
        .catch(err => ToastAndroid.show(err.message, ToastAndroid.SHORT));
    }
  };

  useEffect(() => {
    BluetoothSerial.isEnabled()
      .then(enabled => {
        setIsEnabled(enabled);
        if (enabled) {
          Promise.all([
            BluetoothSerial.list(),
            BluetoothSerial.discoverUnpairedDevices(),
          ]).then(values => {
            const [devicesPaired, devicesUnpaired] = values;
            const foundUnpaired = devicesUnpaired.find(d => d.name === 'Bluno');
            const foundPaired = devicesPaired.find(d => d.name === 'Bluno');
            if (foundPaired != undefined) {
              setDevice(foundPaired);
              connect(foundPaired);
              setDevicePairedFound(true);
            }
            if (foundUnpaired != undefined) {
              setDevice(foundUnpaired);
              pairDevice(foundUnpaired);
              setDeviceUnpairedFound(true);
            }
          });
        }
      })
      .catch(err => {});
  }, []);

  const ReadData = () => {
    if (!connected) {
      ToastAndroid.show('You must connect to device first', ToastAndroid.SHORT);
    } else {
      setInterval(() => {
        BluetoothSerial.write('r')
          .then(res => {
            if (res) {
              BluetoothSerial.withDelimiter('\r').then(() => {
                BluetoothSerial.on('read', data => {
                  console.log(`DATA FROM BLUETOOTH: ${data.data}`);
                  setDataFromDevice(data.data);
                });
              });
            }
          })
          .catch(err => ToastAndroid.show(err.message, ToastAndroid.SHORT));
      }, 2000);
    }
  };

  useEffect(() => {
    ReadData();
  });

  // const dataInOut(message): Observable<any> {
  //   return Observable.create(observer => {
  //     this.bluetoothSerial.isConnected().then(isConnected => {
  //       // this.reader = Observable.fromPromise(this.bluetoothSerial.write(message))
  //       this.reader = from(this.bluetoothSerial.write(message))
  //       .pipe(
  //         flatMap(() => {
  //           return this.bluetoothSerial.subscribeRawData()
  //         }),
  //         flatMap(() => {
  //           return this.bluetoothSerial.readUntil('\n');   // <= delimitador
  //         }));
  //       this.reader.subscribe(data => {
  //         observer.next(data);
  //         this.datos = data;
  //       });
  //     }, notConected => {
  //       observer.next("Estas desconectado");
  //       observer.complete();
  //     });
  //   });
  // }

  return (
    <View style={styles.screen}>
      <Text>Bluetooth App</Text>
      {isEnabled ? (
        <View style={styles.body}>
          <Text>
            {devicePairedFound ? 'Found Bluno' : 'Searching  Bluno device...'}
          </Text>
          {connected ? (
            <View>
              <Text>Connected</Text>
              <View style={styles.button}>
                <Button title="Send on" onPress={writeOn}></Button>
              </View>
              <View style={styles.button}>
                <Button title="Send off" onPress={writeOff}></Button>
              </View>
              <View style={styles.message}>
                <Text>Rate: {dataFromDevice} </Text>
              </View>
            </View>
          ) : null}
          {!connected && deviceUnpairedFound && (
            <View>
              <Button title="Connect" onPress={connectUnpaired}></Button>
            </View>
          )}
        </View>
      ) : (
        <Text>Bluetooth is not enable</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  body: {
    flex: 1,
    paddingVertical: 20,
  },
  button: {
    paddingVertical: 8,
  },
  message: {
    width: '80%',
  },
});

export default App;
