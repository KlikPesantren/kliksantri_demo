import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useProfilPesantren } from '../../hooks/useProfilPesantren';
import { PesantrenHeader } from './PesantrenHeader';

export function TabPesantrenHeader() {
  const navigation = useNavigation();
  const { anak } = useAuth();
  const { data: pesantren } = useProfilPesantren();

  return (
    <PesantrenHeader
      nama={pesantren?.nama_pesantren ?? 'Pesantren'}
      logoUrl={pesantren?.logo_url}
      alamat={pesantren?.alamat}
      showGanti={anak.length > 1}
      onGantiPress={() => navigation.navigate('AnakPilih')}
    />
  );
}
