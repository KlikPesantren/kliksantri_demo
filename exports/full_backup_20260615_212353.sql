--
-- PostgreSQL database dump
--

\restrict Sm0xXleJ6xRPdzDaJCKyaYa7WfDDzJE54TLv00IdRY4qyBLN2ZRoAPcq5rS8TQg

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: absensi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.absensi (
    id integer NOT NULL,
    santri_id integer,
    tanggal date,
    status character varying(20),
    sesi character varying(50)
);


--
-- Name: absensi_guru; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.absensi_guru (
    id integer NOT NULL,
    bulan integer,
    tahun integer,
    total_hadir integer DEFAULT 0,
    total_izin integer DEFAULT 0,
    total_sakit integer DEFAULT 0,
    total_alfa integer DEFAULT 0,
    guru_id integer
);


--
-- Name: absensi_guru_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.absensi_guru_backup (
    id integer,
    nama_guru character varying(100),
    bulan integer,
    tahun integer,
    total_hadir integer,
    total_izin integer,
    total_sakit integer,
    total_alfa integer
);


--
-- Name: absensi_guru_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.absensi_guru_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: absensi_guru_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.absensi_guru_id_seq OWNED BY public.absensi_guru.id;


--
-- Name: absensi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.absensi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: absensi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.absensi_id_seq OWNED BY public.absensi.id;


--
-- Name: absensi_santri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.absensi_santri (
    id integer NOT NULL,
    santri_id integer,
    tanggal date NOT NULL,
    status character varying(20) DEFAULT 'hadir'::character varying,
    keterangan text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: absensi_santri_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.absensi_santri_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: absensi_santri_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.absensi_santri_id_seq OWNED BY public.absensi_santri.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    device_id text,
    event_type text,
    detail text
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: buku_kas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.buku_kas (
    id integer NOT NULL,
    tanggal date NOT NULL,
    jenis character varying(20) NOT NULL,
    kategori character varying(100) NOT NULL,
    keterangan text,
    nominal bigint NOT NULL,
    petugas character varying(100),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: buku_kas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.buku_kas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: buku_kas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.buku_kas_id_seq OWNED BY public.buku_kas.id;


--
-- Name: devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.devices (
    id integer NOT NULL,
    device_id character varying(100),
    device_secret character varying(255),
    nama_device character varying(255),
    status text DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_ping timestamp without time zone,
    ip_address character varying(255),
    merchant_id integer,
    lokasi text,
    firmware_version character varying(50),
    last_sync timestamp without time zone
);


--
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.devices_id_seq OWNED BY public.devices.id;


--
-- Name: guru; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guru (
    id integer NOT NULL,
    nama character varying(100),
    jabatan character varying(100),
    nomor_hp character varying(30),
    email character varying(100),
    alamat text,
    tanggal_masuk date,
    status character varying(20) DEFAULT 'Aktif'::character varying,
    catatan text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: guru_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.guru_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: guru_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.guru_id_seq OWNED BY public.guru.id;


--
-- Name: hafalan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hafalan (
    id integer NOT NULL,
    santri_id integer,
    tanggal date NOT NULL,
    kitab character varying(100) NOT NULL,
    awal character varying(100),
    akhir character varying(100),
    catatan text,
    created_at timestamp without time zone DEFAULT now(),
    pekan integer,
    bulan integer,
    tahun integer
);


--
-- Name: hafalan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hafalan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hafalan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hafalan_id_seq OWNED BY public.hafalan.id;


--
-- Name: jenis_tagihan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jenis_tagihan (
    id integer NOT NULL,
    nama_tagihan character varying(150) NOT NULL,
    is_bulanan boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: jenis_tagihan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jenis_tagihan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jenis_tagihan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jenis_tagihan_id_seq OWNED BY public.jenis_tagihan.id;


--
-- Name: kelas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kelas (
    id integer NOT NULL,
    nama_kelas character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: kelas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kelas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kelas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kelas_id_seq OWNED BY public.kelas.id;


--
-- Name: kesehatan_santri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kesehatan_santri (
    id integer NOT NULL,
    santri_id integer NOT NULL,
    status_kesehatan character varying(20) DEFAULT 'sehat'::character varying NOT NULL,
    keluhan text,
    tindakan_pertama text,
    status_penanganan character varying(50) DEFAULT 'observasi'::character varying NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: kesehatan_santri_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kesehatan_santri_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kesehatan_santri_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kesehatan_santri_id_seq OWNED BY public.kesehatan_santri.id;


--
-- Name: merchant_rfid; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.merchant_rfid (
    id integer NOT NULL,
    nama_merchant character varying(150) NOT NULL,
    status boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: merchant_rfid_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.merchant_rfid_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: merchant_rfid_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.merchant_rfid_id_seq OWNED BY public.merchant_rfid.id;


--
-- Name: nilai_mingguan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nilai_mingguan (
    id integer NOT NULL,
    santri_id integer,
    tanggal date NOT NULL,
    mapel character varying(100) NOT NULL,
    nilai integer DEFAULT 0,
    catatan text,
    created_at timestamp without time zone DEFAULT now(),
    bulan integer,
    tahun integer
);


--
-- Name: nilai_mingguan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.nilai_mingguan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nilai_mingguan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.nilai_mingguan_id_seq OWNED BY public.nilai_mingguan.id;


--
-- Name: pelanggaran; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pelanggaran (
    id integer NOT NULL,
    santri_id integer,
    tanggal date NOT NULL,
    jenis character varying(100),
    poin integer DEFAULT 0,
    catatan text,
    tindakan text,
    created_at timestamp without time zone DEFAULT now(),
    jam time without time zone,
    tingkat character varying(20),
    petugas character varying(100)
);


--
-- Name: pelanggaran_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pelanggaran_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pelanggaran_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pelanggaran_id_seq OWNED BY public.pelanggaran.id;


--
-- Name: pembayaran; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pembayaran (
    id integer NOT NULL,
    santri_id integer,
    jenis_tagihan_id integer,
    bulan character varying(20),
    tahun integer,
    nominal_tagihan bigint NOT NULL,
    nominal_bayar bigint DEFAULT 0,
    sisa_tunggakan bigint DEFAULT 0,
    status character varying(20) DEFAULT 'belum'::character varying,
    catatan text,
    tanggal_bayar timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    sisa_tagihan bigint DEFAULT 0,
    nama_tagihan character varying(255)
);


--
-- Name: pembayaran_detail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pembayaran_detail (
    id integer NOT NULL,
    pembayaran_id integer,
    tanggal date DEFAULT CURRENT_DATE,
    nominal bigint,
    petugas character varying(100),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: pembayaran_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pembayaran_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pembayaran_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pembayaran_detail_id_seq OWNED BY public.pembayaran_detail.id;


--
-- Name: pembayaran_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pembayaran_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pembayaran_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pembayaran_id_seq OWNED BY public.pembayaran.id;


--
-- Name: pembayaran_sahriyah; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pembayaran_sahriyah (
    id integer NOT NULL,
    tagihan_id integer NOT NULL,
    tanggal date DEFAULT CURRENT_DATE,
    nominal bigint NOT NULL,
    petugas character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    nominal_beras numeric(10,2) DEFAULT 0
);


--
-- Name: pembayaran_sahriyah_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pembayaran_sahriyah_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pembayaran_sahriyah_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pembayaran_sahriyah_id_seq OWNED BY public.pembayaran_sahriyah.id;


--
-- Name: pengumuman; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pengumuman (
    id integer NOT NULL,
    judul character varying(200) NOT NULL,
    isi text NOT NULL,
    prioritas character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    published_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    cover_url text
);


--
-- Name: pengumuman_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pengumuman_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pengumuman_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pengumuman_id_seq OWNED BY public.pengumuman.id;


--
-- Name: perizinan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.perizinan (
    id integer NOT NULL,
    santri_id integer,
    tanggal date NOT NULL,
    alasan text,
    jam_keluar time without time zone,
    jam_kembali time without time zone,
    status character varying(20) DEFAULT 'keluar'::character varying,
    catatan text,
    created_at timestamp without time zone DEFAULT now(),
    tujuan character varying(255),
    tanggal_kembali date,
    target_jam_kembali time without time zone,
    petugas character varying(100)
);


--
-- Name: perizinan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.perizinan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: perizinan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.perizinan_id_seq OWNED BY public.perizinan.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id integer NOT NULL,
    key character varying(80) NOT NULL,
    label character varying(150),
    grup character varying(50),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: profil_pesantren; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profil_pesantren (
    id integer NOT NULL,
    nama_pesantren character varying(200) NOT NULL,
    alamat text,
    telepon character varying(30),
    email character varying(100),
    website character varying(200),
    logo_url character varying(500),
    visi text,
    misi text,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    banner_url character varying(500),
    banner_active boolean DEFAULT true NOT NULL,
    splash_logo_url character varying(500),
    app_icon_url character varying(500),
    tagline character varying(200),
    tentang text
);


--
-- Name: profil_pesantren_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.profil_pesantren_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profil_pesantren_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.profil_pesantren_id_seq OWNED BY public.profil_pesantren.id;


--
-- Name: rfid_limit_override; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rfid_limit_override (
    id bigint NOT NULL,
    transaction_uuid uuid,
    santri_id bigint,
    operator_id bigint,
    limit_harian bigint,
    total_hari_ini bigint,
    nominal bigint,
    alasan text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: rfid_limit_override_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rfid_limit_override_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rfid_limit_override_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rfid_limit_override_id_seq OWNED BY public.rfid_limit_override.id;


--
-- Name: rfid_limit_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rfid_limit_settings (
    id bigint NOT NULL,
    santri_id bigint NOT NULL,
    daily_limit bigint DEFAULT 50000,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: rfid_limit_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rfid_limit_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rfid_limit_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rfid_limit_settings_id_seq OWNED BY public.rfid_limit_settings.id;


--
-- Name: rfid_override_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rfid_override_logs (
    id integer NOT NULL,
    trx_uuid text,
    santri_id integer,
    operator_id integer,
    limit_harian integer,
    total_harian integer,
    nominal integer,
    alasan text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: rfid_override_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rfid_override_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rfid_override_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rfid_override_logs_id_seq OWNED BY public.rfid_override_logs.id;


--
-- Name: rfid_sync_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rfid_sync_queue (
    id integer NOT NULL,
    trx_uuid text,
    device_id integer,
    sync_status character varying(20),
    retry_count integer DEFAULT 0,
    last_error text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: rfid_sync_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rfid_sync_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rfid_sync_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rfid_sync_queue_id_seq OWNED BY public.rfid_sync_queue.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id integer NOT NULL,
    permission_id integer NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    label character varying(100),
    is_system boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: sahriyah_setting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sahriyah_setting (
    id integer NOT NULL,
    santri_id integer,
    nominal_uang bigint DEFAULT 0,
    nominal_beras numeric(5,2) DEFAULT 0,
    keterangan text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: sahriyah_setting_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sahriyah_setting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sahriyah_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sahriyah_setting_id_seq OWNED BY public.sahriyah_setting.id;


--
-- Name: santri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.santri (
    id integer NOT NULL,
    nis character varying(50),
    nama character varying(150) NOT NULL,
    foto text,
    uid_rfid character varying(100),
    kelas_id integer,
    alamat text,
    orang_tua character varying(150),
    nomor_hp_ortu character varying(50),
    status character varying(20) DEFAULT 'aktif'::character varying,
    saldo integer DEFAULT 0,
    limit_harian integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    wali_id integer
);


--
-- Name: santri_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.santri_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: santri_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.santri_id_seq OWNED BY public.santri.id;


--
-- Name: tagihan_sahriyah; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tagihan_sahriyah (
    id integer NOT NULL,
    santri_id integer NOT NULL,
    bulan integer NOT NULL,
    tahun integer NOT NULL,
    nominal bigint NOT NULL,
    status character varying(20) DEFAULT 'Belum Lunas'::character varying,
    tanggal_bayar date,
    petugas character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    nominal_beras numeric(5,2) DEFAULT 0,
    keterangan text,
    total_bayar bigint DEFAULT 0,
    sisa_tagihan bigint DEFAULT 0,
    beras_terbayar numeric(10,2) DEFAULT 0,
    sisa_beras numeric(10,2) DEFAULT 0
);


--
-- Name: tagihan_sahriyah_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tagihan_sahriyah_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tagihan_sahriyah_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tagihan_sahriyah_id_seq OWNED BY public.tagihan_sahriyah.id;


--
-- Name: tamu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tamu (
    id integer NOT NULL,
    tanggal date DEFAULT CURRENT_DATE NOT NULL,
    jam_masuk time without time zone DEFAULT CURRENT_TIME NOT NULL,
    jam_keluar time without time zone,
    nama_tamu character varying(150) NOT NULL,
    no_hp character varying(30),
    alamat text,
    instansi character varying(150),
    tujuan character varying(200),
    bertemu_dengan character varying(150),
    keperluan text,
    jumlah_orang integer DEFAULT 1,
    status character varying(30) DEFAULT 'Masuk'::character varying,
    petugas character varying(100),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: tamu_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tamu_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tamu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tamu_id_seq OWNED BY public.tamu.id;


--
-- Name: transaksi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaksi (
    id integer NOT NULL,
    santri_id integer,
    jenis character varying(50),
    nominal integer,
    keterangan text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    trx_id text
);


--
-- Name: transaksi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transaksi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transaksi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transaksi_id_seq OWNED BY public.transaksi.id;


--
-- Name: transaksi_rfid; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaksi_rfid (
    id integer NOT NULL,
    trx_uuid text NOT NULL,
    trx_id text,
    santri_id integer NOT NULL,
    merchant_id integer,
    device_id integer,
    nominal integer NOT NULL,
    saldo_awal integer NOT NULL,
    saldo_akhir integer NOT NULL,
    is_override boolean DEFAULT false,
    sync_status character varying(20) DEFAULT 'synced'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    trx_type text DEFAULT 'payment'::text
);


--
-- Name: transaksi_rfid_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transaksi_rfid_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transaksi_rfid_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transaksi_rfid_id_seq OWNED BY public.transaksi_rfid.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    nama character varying(255),
    username character varying(100),
    password character varying(255),
    role character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'Aktif'::character varying
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: wali_akun; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wali_akun (
    id integer NOT NULL,
    nomor_hp character varying(20) NOT NULL,
    pin_hash character varying(255) NOT NULL,
    nama character varying(100),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    must_change_pin boolean DEFAULT true NOT NULL,
    failed_attempts integer DEFAULT 0 NOT NULL,
    locked_until timestamp without time zone,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: wali_akun_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.wali_akun_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wali_akun_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.wali_akun_id_seq OWNED BY public.wali_akun.id;


--
-- Name: wali_app_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wali_app_audit (
    id integer NOT NULL,
    nomor_hp character varying(20),
    event character varying(50) NOT NULL,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: wali_app_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.wali_app_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wali_app_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.wali_app_audit_id_seq OWNED BY public.wali_app_audit.id;


--
-- Name: wali_santri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wali_santri (
    id integer NOT NULL,
    nama character varying(150) NOT NULL,
    nomor_hp character varying(30),
    alamat text,
    created_at timestamp without time zone DEFAULT now(),
    santri_id integer
);


--
-- Name: wali_santri_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.wali_santri_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wali_santri_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.wali_santri_id_seq OWNED BY public.wali_santri.id;


--
-- Name: absensi id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absensi ALTER COLUMN id SET DEFAULT nextval('public.absensi_id_seq'::regclass);


--
-- Name: absensi_guru id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absensi_guru ALTER COLUMN id SET DEFAULT nextval('public.absensi_guru_id_seq'::regclass);


--
-- Name: absensi_santri id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absensi_santri ALTER COLUMN id SET DEFAULT nextval('public.absensi_santri_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: buku_kas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buku_kas ALTER COLUMN id SET DEFAULT nextval('public.buku_kas_id_seq'::regclass);


--
-- Name: devices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices ALTER COLUMN id SET DEFAULT nextval('public.devices_id_seq'::regclass);


--
-- Name: guru id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guru ALTER COLUMN id SET DEFAULT nextval('public.guru_id_seq'::regclass);


--
-- Name: hafalan id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hafalan ALTER COLUMN id SET DEFAULT nextval('public.hafalan_id_seq'::regclass);


--
-- Name: jenis_tagihan id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jenis_tagihan ALTER COLUMN id SET DEFAULT nextval('public.jenis_tagihan_id_seq'::regclass);


--
-- Name: kelas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kelas ALTER COLUMN id SET DEFAULT nextval('public.kelas_id_seq'::regclass);


--
-- Name: kesehatan_santri id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kesehatan_santri ALTER COLUMN id SET DEFAULT nextval('public.kesehatan_santri_id_seq'::regclass);


--
-- Name: merchant_rfid id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchant_rfid ALTER COLUMN id SET DEFAULT nextval('public.merchant_rfid_id_seq'::regclass);


--
-- Name: nilai_mingguan id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nilai_mingguan ALTER COLUMN id SET DEFAULT nextval('public.nilai_mingguan_id_seq'::regclass);


--
-- Name: pelanggaran id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pelanggaran ALTER COLUMN id SET DEFAULT nextval('public.pelanggaran_id_seq'::regclass);


--
-- Name: pembayaran id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pembayaran ALTER COLUMN id SET DEFAULT nextval('public.pembayaran_id_seq'::regclass);


--
-- Name: pembayaran_detail id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pembayaran_detail ALTER COLUMN id SET DEFAULT nextval('public.pembayaran_detail_id_seq'::regclass);


--
-- Name: pembayaran_sahriyah id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pembayaran_sahriyah ALTER COLUMN id SET DEFAULT nextval('public.pembayaran_sahriyah_id_seq'::regclass);


--
-- Name: pengumuman id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengumuman ALTER COLUMN id SET DEFAULT nextval('public.pengumuman_id_seq'::regclass);


--
-- Name: perizinan id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perizinan ALTER COLUMN id SET DEFAULT nextval('public.perizinan_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: profil_pesantren id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profil_pesantren ALTER COLUMN id SET DEFAULT nextval('public.profil_pesantren_id_seq'::regclass);


--
-- Name: rfid_limit_override id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rfid_limit_override ALTER COLUMN id SET DEFAULT nextval('public.rfid_limit_override_id_seq'::regclass);


--
-- Name: rfid_limit_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rfid_limit_settings ALTER COLUMN id SET DEFAULT nextval('public.rfid_limit_settings_id_seq'::regclass);


--
-- Name: rfid_override_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rfid_override_logs ALTER COLUMN id SET DEFAULT nextval('public.rfid_override_logs_id_seq'::regclass);


--
-- Name: rfid_sync_queue id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rfid_sync_queue ALTER COLUMN id SET DEFAULT nextval('public.rfid_sync_queue_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: sahriyah_setting id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sahriyah_setting ALTER COLUMN id SET DEFAULT nextval('public.sahriyah_setting_id_seq'::regclass);


--
-- Name: santri id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.santri ALTER COLUMN id SET DEFAULT nextval('public.santri_id_seq'::regclass);


--
-- Name: tagihan_sahriyah id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tagihan_sahriyah ALTER COLUMN id SET DEFAULT nextval('public.tagihan_sahriyah_id_seq'::regclass);


--
-- Name: tamu id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tamu ALTER COLUMN id SET DEFAULT nextval('public.tamu_id_seq'::regclass);


--
-- Name: transaksi id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaksi ALTER COLUMN id SET DEFAULT nextval('public.transaksi_id_seq'::regclass);


--
-- Name: transaksi_rfid id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaksi_rfid ALTER COLUMN id SET DEFAULT nextval('public.transaksi_rfid_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: wali_akun id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wali_akun ALTER COLUMN id SET DEFAULT nextval('public.wali_akun_id_seq'::regclass);


--
-- Name: wali_app_audit id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wali_app_audit ALTER COLUMN id SET DEFAULT nextval('public.wali_app_audit_id_seq'::regclass);


--
-- Name: wali_santri id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wali_santri ALTER COLUMN id SET DEFAULT nextval('public.wali_santri_id_seq'::regclass);


--
-- Data for Name: absensi; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.absensi (id, santri_id, tanggal, status, sesi) FROM stdin;
1	12	2026-06-01	H	Ngaji Pagi
3	12	2026-06-01	I	Sekolah
4	12	2026-06-01	H	Ngaji Siang
5	12	2026-06-01	H	Ngaji Sore
6	12	2026-06-01	A	Ngaji Malam
12	13	2026-06-01	H	Ngaji Pagi
13	13	2026-06-02	I	Ngaji Pagi
14	13	2026-06-02	H	Sekolah
15	13	2026-06-01	A	Sekolah
16	13	2026-06-02	H	Ngaji Siang
17	13	2026-06-01	H	Ngaji Siang
18	13	2026-06-01	H	Ngaji Sore
19	13	2026-06-02	H	Ngaji Sore
20	13	2026-06-01	H	Ngaji Malam
21	13	2026-06-02	H	Ngaji Malam
\.


--
-- Data for Name: absensi_guru; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.absensi_guru (id, bulan, tahun, total_hadir, total_izin, total_sakit, total_alfa, guru_id) FROM stdin;
1	6	2026	40	1	11	2	1
4	6	2026	0	0	0	0	2
\.


--
-- Data for Name: absensi_guru_backup; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.absensi_guru_backup (id, nama_guru, bulan, tahun, total_hadir, total_izin, total_sakit, total_alfa) FROM stdin;
\.


--
-- Data for Name: absensi_santri; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.absensi_santri (id, santri_id, tanggal, status, keterangan, created_at) FROM stdin;
1	1	2026-05-28	hadir	Ngaji pagi	2026-05-28 09:48:41.197196
2	1	2026-05-27	alfa	tidur	2026-05-28 14:04:47.830968
3	1	2026-05-27	alfa	ngaji siang	2026-05-28 14:05:07.400359
4	1	2026-05-01	H	\N	2026-05-28 20:27:54.372828
5	1	2026-05-01	I	\N	2026-05-28 20:27:54.39885
6	1	2026-05-01	A	\N	2026-05-28 20:27:54.405547
7	1	2026-05-01	H	\N	2026-05-28 20:27:54.411041
8	1	2026-05-01	H	\N	2026-05-28 20:27:54.416818
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, created_at, device_id, event_type, detail) FROM stdin;
1	2026-05-25 09:55:19.448895	EDC01	TEST	manual test
2	2026-05-25 09:55:19.583161	EDC01	BOOT	device started
3	2026-05-25 09:55:19.808459	EDC01	TEST	manual test
4	2026-05-25 09:55:19.921641	EDC01	TEST	manual test
5	2026-05-25 09:55:20.263343	EDC01	TEST	manual test
6	2026-05-25 09:55:20.557964	EDC01	TEST	manual test
7	2026-05-25 09:55:20.73356	EDC01	TEST	manual test
8	2026-05-25 09:55:21.052504	EDC01	TEST	manual test
9	2026-05-25 09:55:21.170927	EDC01	TEST	manual test
10	2026-05-25 09:55:23.553158	EDC01	TEST	manual test
11	2026-05-25 09:55:23.584085	EDC01	TEST	manual test
12	2026-05-25 09:55:23.747727	EDC01	TEST	manual test
13	2026-05-25 09:55:25.986512	EDC01	TEST	manual test
14	2026-05-25 09:55:26.110151	EDC01	TEST	manual test
15	2026-05-25 09:55:26.220746	EDC01	TEST	manual test
16	2026-05-25 09:55:26.336621	EDC01	TEST	manual test
17	2026-05-25 09:55:28.130663	EDC01	TEST	manual test
18	2026-05-25 09:55:29.326393	EDC01	TEST	manual test
19	2026-05-25 09:55:31.119192	EDC01	TEST	manual test
20	2026-05-25 09:55:31.218241	EDC01	TEST	manual test
21	2026-05-25 09:55:31.479155	EDC01	TEST	manual test
22	2026-05-25 09:55:31.609931	EDC01	TEST	manual test
23	2026-05-25 09:55:31.731661	EDC01	TEST	manual test
24	2026-05-25 09:55:32.044747	EDC01	TEST	manual test
25	2026-05-25 09:55:34.557805	EDC01	TEST	manual test
26	2026-05-25 09:55:34.909634	EDC01	TEST	manual test
27	2026-05-25 09:55:35.090695	EDC01	TEST	manual test
28	2026-05-25 09:55:35.217392	EDC01	TEST	manual test
29	2026-05-25 09:55:35.434543	EDC01	TEST	manual test
30	2026-05-25 09:55:36.546001	EDC01	TEST	manual test
31	2026-05-25 09:55:48.176414	EDC01	TEST	manual test
32	2026-05-25 09:55:51.109002	EDC01	TEST	manual test
33	2026-05-25 09:55:51.276529	EDC01	TEST	manual test
34	2026-05-25 09:55:51.404849	EDC01	TEST	manual test
35	2026-05-25 09:55:51.527375	EDC01	TEST	manual test
36	2026-05-25 09:55:51.645011	EDC01	TEST	manual test
37	2026-05-25 09:55:52.062351	EDC01	TEST	manual test
38	2026-05-25 09:55:52.196613	EDC01	TEST	manual test
39	2026-05-25 09:55:52.422554	EDC01	TEST	manual test
40	2026-05-25 09:55:52.55676	EDC01	TEST	manual test
41	2026-05-25 09:55:52.675209	EDC01	TEST	manual test
42	2026-05-25 09:55:53.567433	EDC01	TEST	manual test
43	2026-05-25 09:55:56.106006	EDC01	TEST	manual test
44	2026-05-25 09:55:56.225178	EDC01	TEST	manual test
45	2026-05-25 09:55:56.472316	EDC01	TEST	manual test
46	2026-05-25 09:55:56.688129	EDC01	TEST	manual test
47	2026-05-25 09:55:56.735195	EDC01	TEST	manual test
48	2026-05-25 09:55:56.942315	EDC01	TEST	manual test
49	2026-05-25 09:55:57.289653	EDC01	TEST	manual test
50	2026-05-25 09:55:57.412413	EDC01	TEST	manual test
51	2026-05-25 09:55:57.523237	EDC01	TEST	manual test
52	2026-05-25 09:55:57.646901	EDC01	TEST	manual test
53	2026-05-25 09:55:57.919556	EDC01	TEST	manual test
54	2026-05-25 09:55:58.046072	EDC01	TEST	manual test
55	2026-05-25 09:55:58.099284	EDC01	TEST	manual test
56	2026-05-25 09:55:58.204778	EDC01	TEST	manual test
57	2026-05-25 09:55:58.317797	EDC01	TEST	manual test
58	2026-05-25 09:55:58.450047	EDC01	TEST	manual test
59	2026-05-25 09:55:58.818722	EDC01	TEST	manual test
60	2026-05-25 09:55:58.927447	EDC01	TEST	manual test
61	2026-05-25 09:55:59.132116	EDC01	TEST	manual test
62	2026-05-25 09:56:01.616292	EDC01	TEST	manual test
63	2026-05-25 09:56:01.735854	EDC01	TEST	manual test
64	2026-05-25 09:56:01.941203	EDC01	TEST	manual test
65	2026-05-25 09:56:02.199338	EDC01	TEST	manual test
66	2026-05-25 09:56:02.511056	EDC01	TEST	manual test
67	2026-05-25 09:56:02.811779	EDC01	TEST	manual test
68	2026-05-25 09:56:03.427	EDC01	TEST	manual test
69	2026-05-25 09:56:03.568181	EDC01	TEST	manual test
70	2026-05-25 09:56:03.677857	EDC01	TEST	manual test
71	2026-05-25 09:56:04.039736	EDC01	TEST	manual test
72	2026-05-25 09:56:04.349463	EDC01	TEST	manual test
73	2026-05-25 09:56:04.453576	EDC01	TEST	manual test
74	2026-05-25 09:56:04.556561	EDC01	TEST	manual test
75	2026-05-25 09:56:04.659893	EDC01	TEST	manual test
76	2026-05-25 09:56:05.010716	EDC01	TEST	manual test
77	2026-05-25 09:56:05.204237	EDC01	TEST	manual test
78	2026-05-25 09:56:05.313256	EDC01	TEST	manual test
79	2026-05-25 09:56:05.428861	EDC01	TEST	manual test
80	2026-05-25 09:56:05.575158	EDC01	TEST	manual test
81	2026-05-25 09:56:05.678257	EDC01	TEST	manual test
82	2026-05-25 09:56:05.883994	EDC01	TEST	manual test
83	2026-05-25 09:56:06.189274	EDC01	TEST	manual test
84	2026-05-25 09:56:06.355336	EDC01	TEST	manual test
85	2026-05-25 09:56:06.552395	EDC01	TEST	manual test
86	2026-05-25 09:56:06.854933	EDC01	TEST	manual test
87	2026-05-25 09:56:07.421765	EDC01	TEST	manual test
88	2026-05-25 09:56:07.593078	EDC01	TEST	manual test
89	2026-05-25 09:56:08.044225	EDC01	TEST	manual test
90	2026-05-25 09:56:08.2364	EDC01	TEST	manual test
91	2026-05-25 09:56:08.646825	EDC01	TEST	manual test
92	2026-05-25 09:56:08.811057	EDC01	TEST	manual test
93	2026-05-25 09:56:08.902927	EDC01	TEST	manual test
94	2026-05-25 09:56:09.011249	EDC01	TEST	manual test
95	2026-05-25 09:56:09.26372	EDC01	TEST	manual test
96	2026-05-25 09:56:09.550782	EDC01	TEST	manual test
97	2026-05-25 09:56:09.875612	EDC01	TEST	manual test
98	2026-05-25 09:56:10.075667	EDC01	TEST	manual test
99	2026-05-25 09:56:10.490556	EDC01	TEST	manual test
100	2026-05-25 09:56:10.587495	EDC01	TEST	manual test
101	2026-05-25 09:56:10.69832	EDC01	TEST	manual test
102	2026-05-25 09:56:10.813552	EDC01	TEST	manual test
103	2026-05-25 09:56:11.053812	EDC01	TEST	manual test
104	2026-05-25 09:56:11.54832	EDC01	TEST	manual test
105	2026-05-25 09:56:11.66633	EDC01	TEST	manual test
106	2026-05-25 09:56:11.767699	EDC01	TEST	manual test
107	2026-05-25 09:56:11.87061	EDC01	TEST	manual test
108	2026-05-25 09:56:11.978129	EDC01	TEST	manual test
109	2026-05-25 09:56:12.335405	EDC01	TEST	manual test
110	2026-05-25 09:56:12.639733	EDC01	TEST	manual test
111	2026-05-25 09:56:12.738678	EDC01	TEST	manual test
112	2026-05-25 09:56:12.842186	EDC01	TEST	manual test
113	2026-05-25 09:56:15.513097	EDC01	TEST	manual test
114	2026-05-25 09:56:15.712878	EDC01	TEST	manual test
115	2026-05-25 09:56:16.019674	EDC01	TEST	manual test
116	2026-05-25 09:56:16.328776	EDC01	TEST	manual test
117	2026-05-25 09:56:16.43426	EDC01	TEST	manual test
118	2026-05-25 09:56:16.566864	EDC01	TEST	manual test
119	2026-05-25 09:56:16.944699	EDC01	TEST	manual test
120	2026-05-25 09:56:17.258824	EDC01	TEST	manual test
121	2026-05-25 09:56:17.373297	EDC01	TEST	manual test
122	2026-05-25 09:56:17.48734	EDC01	TEST	manual test
123	2026-05-25 09:56:17.604558	EDC01	TEST	manual test
124	2026-05-25 09:56:17.791198	EDC01	TEST	manual test
125	2026-05-25 09:56:17.922746	EDC01	TEST	manual test
126	2026-05-25 09:56:18.487285	EDC01	TEST	manual test
127	2026-05-25 09:56:18.79155	EDC01	TEST	manual test
128	2026-05-25 09:56:19.095102	EDC01	TEST	manual test
129	2026-05-25 09:56:19.235082	EDC01	TEST	manual test
130	2026-05-25 09:56:19.399222	EDC01	TEST	manual test
131	2026-05-25 09:56:19.550922	EDC01	TEST	manual test
132	2026-05-25 09:56:19.666113	EDC01	TEST	manual test
133	2026-05-25 09:56:20.014712	EDC01	TEST	manual test
134	2026-05-25 09:56:20.179999	EDC01	TEST	manual test
135	2026-05-25 09:56:20.28998	EDC01	TEST	manual test
136	2026-05-25 09:56:20.405474	EDC01	TEST	manual test
137	2026-05-25 09:56:20.52106	EDC01	TEST	manual test
138	2026-05-25 09:56:20.618277	EDC01	TEST	manual test
139	2026-05-25 09:56:20.716908	EDC01	TEST	manual test
140	2026-05-25 09:56:20.832019	EDC01	TEST	manual test
141	2026-05-25 09:56:20.963229	EDC01	TEST	manual test
142	2026-05-25 09:56:21.273166	EDC01	TEST	manual test
143	2026-05-25 09:56:21.603775	EDC01	TEST	manual test
144	2026-05-25 09:56:21.749669	EDC01	TEST	manual test
145	2026-05-25 09:56:22.074626	EDC01	TEST	manual test
146	2026-05-25 09:56:22.202472	EDC01	TEST	manual test
147	2026-05-25 09:56:22.329049	EDC01	TEST	manual test
148	2026-05-25 09:56:22.580563	EDC01	TEST	manual test
149	2026-05-25 09:56:22.833364	EDC01	TEST	manual test
150	2026-05-25 09:56:23.06959	EDC01	TEST	manual test
151	2026-05-25 09:56:23.703998	EDC01	TEST	manual test
152	2026-05-25 09:56:24.010418	EDC01	TEST	manual test
153	2026-05-25 09:56:24.146736	EDC01	TEST	manual test
154	2026-05-25 09:56:24.319453	EDC01	TEST	manual test
155	2026-05-25 09:56:24.643533	EDC01	TEST	manual test
156	2026-05-25 09:56:24.82629	EDC01	TEST	manual test
157	2026-05-25 09:56:24.948403	EDC01	TEST	manual test
158	2026-05-25 09:56:25.241393	EDC01	TEST	manual test
159	2026-05-25 09:56:25.544468	EDC01	TEST	manual test
160	2026-05-25 09:56:25.859084	EDC01	TEST	manual test
161	2026-05-25 09:56:26.067603	EDC01	TEST	manual test
162	2026-05-25 09:56:26.198519	EDC01	TEST	manual test
163	2026-05-25 09:56:26.307769	EDC01	TEST	manual test
164	2026-05-25 09:56:26.467703	EDC01	TEST	manual test
165	2026-05-25 09:56:26.774461	EDC01	TEST	manual test
166	2026-05-25 09:56:26.896424	EDC01	TEST	manual test
167	2026-05-25 09:56:27.087649	EDC01	TEST	manual test
168	2026-05-25 09:56:29.345942	EDC01	TEST	manual test
169	2026-05-25 09:56:29.544645	EDC01	TEST	manual test
170	2026-05-25 09:56:29.881583	EDC01	TEST	manual test
171	2026-05-25 09:56:29.992638	EDC01	TEST	manual test
172	2026-05-25 09:56:30.105811	EDC01	TEST	manual test
173	2026-05-25 09:56:30.495407	EDC01	TEST	manual test
174	2026-05-25 09:56:31.575382	EDC01	TEST	manual test
175	2026-05-25 09:56:32.91573	EDC01	TEST	manual test
176	2026-05-25 09:56:33.014763	EDC01	TEST	manual test
177	2026-05-25 09:56:33.053814	EDC01	TEST	manual test
178	2026-05-25 09:56:33.222469	EDC01	TEST	manual test
179	2026-05-25 09:56:33.513551	EDC01	TEST	manual test
180	2026-05-25 09:56:33.621493	EDC01	TEST	manual test
181	2026-05-25 09:56:33.860793	EDC01	TEST	manual test
182	2026-05-25 09:56:34.074944	EDC01	TEST	manual test
183	2026-05-25 09:56:34.760776	EDC01	TEST	manual test
184	2026-05-25 09:56:34.931496	EDC01	TEST	manual test
185	2026-05-25 09:56:35.075694	EDC01	TEST	manual test
186	2026-05-25 09:56:35.210406	EDC01	TEST	manual test
187	2026-05-25 09:56:35.380502	EDC01	TEST	manual test
188	2026-05-25 09:56:35.519656	EDC01	TEST	manual test
189	2026-05-25 09:56:35.688033	EDC01	TEST	manual test
190	2026-05-25 09:56:35.842329	EDC01	TEST	manual test
191	2026-05-25 09:56:36.026783	EDC01	TEST	manual test
192	2026-05-25 09:56:36.296785	EDC01	TEST	manual test
193	2026-05-25 09:56:36.40026	EDC01	TEST	manual test
194	2026-05-25 09:56:36.495661	EDC01	TEST	manual test
195	2026-05-25 09:56:36.910715	EDC01	TEST	manual test
196	2026-05-25 09:56:37.21869	EDC01	TEST	manual test
197	2026-05-25 09:56:37.546891	EDC01	TEST	manual test
198	2026-05-25 09:56:37.832268	EDC01	TEST	manual test
199	2026-05-25 09:56:37.93183	EDC01	TEST	manual test
200	2026-05-25 09:56:38.094306	EDC01	TEST	manual test
201	2026-05-25 09:56:38.448227	EDC01	TEST	manual test
202	2026-05-25 09:56:38.559581	EDC01	TEST	manual test
203	2026-05-25 09:56:38.706968	EDC01	TEST	manual test
204	2026-05-25 09:56:38.815674	EDC01	TEST	manual test
205	2026-05-25 09:56:39.062094	EDC01	TEST	manual test
206	2026-05-25 09:56:39.377809	EDC01	TEST	manual test
207	2026-05-25 09:56:39.499812	EDC01	TEST	manual test
208	2026-05-25 09:56:39.625347	EDC01	TEST	manual test
209	2026-05-25 09:56:39.759725	EDC01	TEST	manual test
210	2026-05-25 09:56:39.863594	EDC01	TEST	manual test
211	2026-05-25 09:56:39.973743	EDC01	TEST	manual test
212	2026-05-25 09:56:40.139813	EDC01	TEST	manual test
213	2026-05-25 09:56:43.085339	EDC01	TEST	manual test
214	2026-05-25 09:56:49.590128	EDC01	TEST	manual test
215	2026-05-25 09:56:49.748385	EDC01	TEST	manual test
216	2026-05-25 09:56:49.858264	EDC01	TEST	manual test
217	2026-05-25 09:56:49.997313	EDC01	TEST	manual test
218	2026-05-25 09:56:50.44881	EDC01	TEST	manual test
219	2026-05-25 09:56:50.560178	EDC01	TEST	manual test
220	2026-05-25 09:56:51.048327	EDC01	TEST	manual test
221	2026-05-25 09:56:51.160652	EDC01	TEST	manual test
222	2026-05-25 09:56:51.326498	EDC01	TEST	manual test
223	2026-05-25 09:56:51.498442	EDC01	TEST	manual test
224	2026-05-25 09:56:51.985146	EDC01	TEST	manual test
225	2026-05-25 09:56:52.188391	EDC01	TEST	manual test
226	2026-05-25 09:56:52.310356	EDC01	TEST	manual test
227	2026-05-25 09:56:52.435371	EDC01	TEST	manual test
228	2026-05-25 09:56:52.587483	EDC01	TEST	manual test
229	2026-05-25 09:56:52.731846	EDC01	TEST	manual test
230	2026-05-25 09:56:52.911715	EDC01	TEST	manual test
231	2026-05-25 09:56:53.051664	EDC01	TEST	manual test
232	2026-05-25 09:56:53.279961	EDC01	TEST	manual test
233	2026-05-25 09:56:53.481276	EDC01	TEST	manual test
234	2026-05-25 09:56:53.668371	EDC01	TEST	manual test
235	2026-05-25 09:56:54.160517	EDC01	TEST	manual test
236	2026-05-25 09:56:54.484944	EDC01	TEST	manual test
237	2026-05-25 09:56:54.785994	EDC01	TEST	manual test
238	2026-05-25 09:56:55.053017	EDC01	TEST	manual test
239	2026-05-25 09:56:55.401159	EDC01	TEST	manual test
240	2026-05-25 09:56:55.639951	EDC01	TEST	manual test
241	2026-05-25 09:56:56.00843	EDC01	TEST	manual test
242	2026-05-25 09:56:56.333674	EDC01	TEST	manual test
243	2026-05-25 09:56:56.913701	EDC01	TEST	manual test
244	2026-05-25 09:56:57.518346	EDC01	TEST	manual test
245	2026-05-25 09:56:58.727482	EDC01	TEST	manual test
246	2026-05-25 09:56:59.075771	EDC01	TEST	manual test
247	2026-05-25 09:56:59.281531	EDC01	TEST	manual test
248	2026-05-25 09:56:59.658862	EDC01	TEST	manual test
249	2026-05-25 09:56:59.966964	EDC01	TEST	manual test
250	2026-05-25 09:57:00.299695	EDC01	TEST	manual test
251	2026-05-25 09:57:00.615522	EDC01	TEST	manual test
252	2026-05-25 09:57:01.097613	EDC01	TEST	manual test
253	2026-05-25 09:57:01.498431	EDC01	TEST	manual test
254	2026-05-25 09:57:01.796237	EDC01	TEST	manual test
255	2026-05-25 09:57:02.10169	EDC01	TEST	manual test
256	2026-05-25 09:57:02.410995	EDC01	TEST	manual test
257	2026-05-25 09:57:03.06187	EDC01	TEST	manual test
258	2026-05-25 09:57:03.332455	EDC01	TEST	manual test
259	2026-05-25 09:57:03.58915	EDC01	TEST	manual test
260	2026-05-25 09:57:03.94445	EDC01	TEST	manual test
261	2026-05-25 09:57:04.15545	EDC01	TEST	manual test
262	2026-05-25 09:57:04.565677	EDC01	TEST	manual test
263	2026-05-25 09:57:07.95862	EDC01	TEST	manual test
264	2026-05-25 09:57:09.125751	EDC01	TEST	manual test
265	2026-05-25 09:57:09.540735	EDC01	TEST	manual test
266	2026-05-25 09:57:10.105276	EDC01	TEST	manual test
267	2026-05-25 09:57:10.655352	EDC01	TEST	manual test
268	2026-05-25 09:57:10.856665	EDC01	TEST	manual test
269	2026-05-25 09:57:11.191891	EDC01	TEST	manual test
270	2026-05-25 09:57:11.675602	EDC01	TEST	manual test
271	2026-05-25 09:57:12.217703	EDC01	TEST	manual test
272	2026-05-25 09:57:12.613755	EDC01	TEST	manual test
273	2026-05-25 09:57:12.856538	EDC01	TEST	manual test
274	2026-05-25 09:57:13.48112	EDC01	TEST	manual test
275	2026-05-25 09:57:14.115913	EDC01	TEST	manual test
276	2026-05-25 09:57:14.29885	EDC01	TEST	manual test
277	2026-05-25 09:57:14.715877	EDC01	TEST	manual test
278	2026-05-25 09:57:15.033153	EDC01	TEST	manual test
279	2026-05-25 09:57:15.329557	EDC01	TEST	manual test
280	2026-05-25 09:57:15.641029	EDC01	TEST	manual test
281	2026-05-25 09:57:15.856887	EDC01	TEST	manual test
282	2026-05-25 09:57:16.113186	EDC01	TEST	manual test
283	2026-05-25 09:57:16.555313	EDC01	TEST	manual test
284	2026-05-25 09:57:17.102286	EDC01	TEST	manual test
285	2026-05-25 09:57:17.491079	EDC01	TEST	manual test
286	2026-05-25 09:57:17.779859	EDC01	TEST	manual test
287	2026-05-25 09:57:18.118488	EDC01	TEST	manual test
288	2026-05-25 09:57:19.343821	EDC01	TEST	manual test
289	2026-05-25 09:57:19.635894	EDC01	TEST	manual test
290	2026-05-25 09:57:19.940456	EDC01	TEST	manual test
291	2026-05-25 09:57:20.233576	EDC01	TEST	manual test
292	2026-05-25 09:57:20.61646	EDC01	TEST	manual test
293	2026-05-25 09:57:21.119616	EDC01	TEST	manual test
294	2026-05-25 09:57:21.477066	EDC01	TEST	manual test
295	2026-05-25 09:57:22.084686	EDC01	TEST	manual test
296	2026-05-25 09:57:22.384785	EDC01	TEST	manual test
297	2026-05-25 09:57:22.700967	EDC01	TEST	manual test
298	2026-05-25 09:57:23.018113	EDC01	TEST	manual test
299	2026-05-25 09:57:23.346103	EDC01	TEST	manual test
300	2026-05-25 09:57:23.94305	EDC01	TEST	manual test
301	2026-05-25 09:57:24.234389	EDC01	TEST	manual test
302	2026-05-25 09:57:24.553559	EDC01	TEST	manual test
303	2026-05-25 09:57:24.838996	EDC01	TEST	manual test
304	2026-05-25 09:57:25.137636	EDC01	TEST	manual test
305	2026-05-25 09:57:25.484222	EDC01	TEST	manual test
306	2026-05-25 09:57:25.809581	EDC01	TEST	manual test
307	2026-05-25 09:57:26.392511	EDC01	TEST	manual test
308	2026-05-25 09:57:31.103213	EDC01	TEST	manual test
309	2026-05-25 09:57:31.288349	EDC01	TEST	manual test
310	2026-05-25 09:57:31.903669	EDC01	TEST	manual test
311	2026-05-25 09:57:32.209293	EDC01	TEST	manual test
312	2026-05-25 09:57:32.530901	EDC01	TEST	manual test
313	2026-05-25 09:57:32.823254	EDC01	TEST	manual test
314	2026-05-25 09:57:33.078814	EDC01	TEST	manual test
315	2026-05-25 09:57:33.457248	EDC01	TEST	manual test
316	2026-05-25 09:57:33.75738	EDC01	TEST	manual test
317	2026-05-25 09:57:34.052169	EDC01	TEST	manual test
318	2026-05-25 09:57:34.356238	EDC01	TEST	manual test
319	2026-05-25 09:57:34.674662	EDC01	TEST	manual test
320	2026-05-25 09:57:36.978261	EDC01	TEST	manual test
321	2026-05-25 09:57:37.080534	EDC01	TEST	manual test
322	2026-05-25 09:57:37.13768	EDC01	TEST	manual test
323	2026-05-25 09:57:37.277881	EDC01	TEST	manual test
324	2026-05-25 09:57:37.405488	EDC01	TEST	manual test
325	2026-05-25 09:57:37.569324	EDC01	TEST	manual test
326	2026-05-25 09:57:38.060627	EDC01	TEST	manual test
327	2026-05-25 09:57:38.600623	EDC01	TEST	manual test
328	2026-05-25 09:57:39.325206	EDC01	TEST	manual test
329	2026-05-25 09:57:39.583359	EDC01	TEST	manual test
330	2026-05-25 09:57:39.782111	EDC01	TEST	manual test
331	2026-05-25 09:57:39.905552	EDC01	TEST	manual test
332	2026-05-25 09:57:40.089568	EDC01	TEST	manual test
333	2026-05-25 09:57:40.28002	EDC01	TEST	manual test
334	2026-05-25 09:57:40.399694	EDC01	TEST	manual test
335	2026-05-25 09:57:40.814614	EDC01	TEST	manual test
336	2026-05-25 09:57:41.105578	EDC01	TEST	manual test
337	2026-05-25 09:57:41.356842	EDC01	TEST	manual test
338	2026-05-25 09:57:41.56406	EDC01	TEST	manual test
339	2026-05-25 09:57:41.775019	EDC01	TEST	manual test
340	2026-05-25 09:57:41.932116	EDC01	TEST	manual test
341	2026-05-25 09:57:42.158144	EDC01	TEST	manual test
342	2026-05-25 09:57:44.555221	EDC01	TEST	manual test
343	2026-05-25 09:57:44.693329	EDC01	TEST	manual test
344	2026-05-25 09:57:45.096082	EDC01	TEST	manual test
345	2026-05-25 09:57:45.211335	EDC01	TEST	manual test
346	2026-05-25 09:57:45.324159	EDC01	TEST	manual test
347	2026-05-25 09:57:45.724684	EDC01	TEST	manual test
348	2026-05-25 09:57:45.919647	EDC01	TEST	manual test
349	2026-05-25 09:57:46.089964	EDC01	TEST	manual test
350	2026-05-25 09:57:46.246214	EDC01	TEST	manual test
351	2026-05-25 09:57:46.59134	EDC01	TEST	manual test
352	2026-05-25 09:57:46.604482	EDC01	TEST	manual test
353	2026-05-25 09:57:46.961573	EDC01	TEST	manual test
354	2026-05-25 09:57:47.092068	EDC01	TEST	manual test
355	2026-05-25 09:57:47.210158	EDC01	TEST	manual test
356	2026-05-25 09:57:47.900797	EDC01	TEST	manual test
357	2026-05-25 09:57:48.082219	EDC01	TEST	manual test
358	2026-05-25 09:57:48.210466	EDC01	TEST	manual test
359	2026-05-25 09:57:48.343515	EDC01	TEST	manual test
360	2026-05-25 09:57:48.491508	EDC01	TEST	manual test
361	2026-05-25 09:57:48.812531	EDC01	TEST	manual test
362	2026-05-25 09:57:49.420645	EDC01	TEST	manual test
363	2026-05-25 09:57:49.568096	EDC01	TEST	manual test
364	2026-05-25 09:57:49.717973	EDC01	TEST	manual test
365	2026-05-25 09:57:50.034841	EDC01	TEST	manual test
366	2026-05-25 09:57:50.589993	EDC01	TEST	manual test
367	2026-05-25 09:57:50.779784	EDC01	TEST	manual test
368	2026-05-25 09:57:50.947207	EDC01	TEST	manual test
369	2026-05-25 09:57:51.076764	EDC01	TEST	manual test
370	2026-05-25 09:57:51.206409	EDC01	TEST	manual test
371	2026-05-25 09:57:51.55959	EDC01	TEST	manual test
372	2026-05-25 09:57:51.874864	EDC01	TEST	manual test
373	2026-05-25 09:57:59.738146	EDC01	TEST	manual test
374	2026-05-25 09:58:00.408815	EDC01	TEST	manual test
375	2026-05-25 09:58:00.658525	EDC01	TEST	manual test
376	2026-05-25 09:58:03.541354	EDC01	TEST	manual test
377	2026-05-25 09:58:03.595751	EDC01	TEST	manual test
378	2026-05-25 09:58:03.855873	EDC01	TEST	manual test
379	2026-05-25 09:58:37.126789	EDC01	BOOT	device started
380	2026-05-25 10:53:00.515263	EDC01	SYNC_FAILED	EDC01-176518
381	2026-05-25 10:53:00.762378	EDC01	WIFI_ON	wifi connected
382	2026-05-25 10:53:06.095381	EDC01	SYNC_FAILED	EDC01-176518
383	2026-05-25 10:53:17.762157	EDC01	SYNC_FAILED	EDC01-176518
384	2026-05-25 10:53:28.206863	EDC01	SYNC_FAILED	EDC01-176518
385	2026-05-25 10:53:36.359331	EDC01	SYNC_FAILED	EDC01-176518
386	2026-05-25 10:53:46.040635	EDC01	SYNC_FAILED	EDC01-176518
387	2026-05-25 10:53:59.234122	EDC01	SYNC_FAILED	EDC01-176518
388	2026-05-25 10:54:06.914379	EDC01	SYNC_FAILED	EDC01-176518
389	2026-05-25 10:54:17.05177	EDC01	SYNC_FAILED	EDC01-176518
390	2026-05-25 10:54:28.316276	EDC01	SYNC_FAILED	EDC01-176518
391	2026-05-25 10:54:36.413906	EDC01	SYNC_FAILED	EDC01-176518
392	2026-05-25 10:54:47.466578	EDC01	SYNC_FAILED	EDC01-176518
393	2026-05-25 10:55:08.357558	EDC01	SYNC_FAILED	EDC01-176518
394	2026-05-25 10:55:18.808057	EDC01	SYNC_FAILED	EDC01-176518
395	2026-05-25 10:55:28.323317	EDC01	SYNC_FAILED	EDC01-176518
396	2026-05-25 10:55:37.01902	EDC01	SYNC_FAILED	EDC01-176518
397	2026-05-25 10:55:47.369713	EDC01	SYNC_FAILED	EDC01-176518
398	2026-05-25 10:56:07.048248	EDC01	SYNC_FAILED	EDC01-176518
399	2026-05-25 10:56:13.292857	EDC01	SYNC_FAILED	EDC01-176518
400	2026-05-25 10:56:16.445918	EDC01	SYNC_FAILED	EDC01-176518
401	2026-05-25 10:56:26.475975	EDC01	SYNC_FAILED	EDC01-176518
402	2026-05-25 10:56:44.965558	EDC01	BOOT	device started
403	2026-05-25 10:56:45.52718	EDC01	WIFI_ON	wifi connected
404	2026-05-25 10:56:53.337814	EDC01	SYNC_FAILED	EDC01-176518
405	2026-05-25 10:57:02.954241	EDC01	SYNC_FAILED	EDC01-176518
406	2026-05-25 10:57:12.594888	EDC01	SYNC_FAILED	EDC01-176518
407	2026-05-25 10:57:23.226652	EDC01	SYNC_FAILED	EDC01-176518
408	2026-05-25 10:57:32.133233	EDC01	SYNC_FAILED	EDC01-176518
409	2026-05-25 10:57:42.569312	EDC01	SYNC_FAILED	EDC01-176518
410	2026-05-25 10:57:52.173366	EDC01	SYNC_FAILED	EDC01-176518
411	2026-05-25 10:58:05.301192	EDC01	SYNC_FAILED	EDC01-176518
412	2026-05-25 10:58:14.837985	EDC01	SYNC_FAILED	EDC01-176518
413	2026-05-25 10:58:22.293258	EDC01	SYNC_FAILED	EDC01-176518
414	2026-05-25 10:58:34.889916	EDC01	SYNC_FAILED	EDC01-176518
415	2026-05-25 10:58:42.780268	EDC01	SYNC_FAILED	EDC01-176518
416	2026-05-25 10:58:53.532652	EDC01	SYNC_FAILED	EDC01-176518
417	2026-05-25 10:59:03.064767	EDC01	SYNC_FAILED	EDC01-176518
418	2026-05-25 10:59:14.421308	EDC01	SYNC_FAILED	EDC01-176518
419	2026-05-25 10:59:24.569201	EDC01	SYNC_FAILED	EDC01-176518
420	2026-05-25 10:59:35.007748	EDC01	SYNC_FAILED	EDC01-176518
421	2026-05-25 10:59:42.689994	EDC01	SYNC_FAILED	EDC01-176518
422	2026-05-25 10:59:52.52743	EDC01	SYNC_FAILED	EDC01-176518
423	2026-05-25 11:00:04.845996	EDC01	SYNC_FAILED	EDC01-176518
424	2026-05-25 11:00:12.795162	EDC01	SYNC_FAILED	EDC01-176518
425	2026-05-25 11:00:22.625805	EDC01	SYNC_FAILED	EDC01-176518
426	2026-05-25 11:00:44.738651	EDC01	SYNC_FAILED	EDC01-176518
427	2026-05-25 11:00:54.450346	EDC01	SYNC_FAILED	EDC01-176518
428	2026-05-25 11:01:35.152147	EDC01	SYNC_FAILED	EDC01-176518
429	2026-05-25 11:01:43.868265	EDC01	SYNC_FAILED	EDC01-176518
430	2026-05-25 11:01:53.212533	EDC01	SYNC_FAILED	EDC01-176518
431	2026-05-25 11:02:06.922165	EDC01	SYNC_FAILED	EDC01-176518
432	2026-05-25 11:02:17.032596	EDC01	SYNC_FAILED	EDC01-176518
433	2026-05-25 11:02:26.538852	EDC01	SYNC_FAILED	EDC01-176518
434	2026-05-25 11:02:38.120692	EDC01	SYNC_FAILED	EDC01-176518
435	2026-05-25 11:02:47.990954	EDC01	SYNC_FAILED	EDC01-176518
436	2026-05-25 11:02:56.190652	EDC01	SYNC_FAILED	EDC01-176518
437	2026-05-25 11:03:06.22614	EDC01	SYNC_FAILED	EDC01-176518
438	2026-05-25 11:03:16.343946	EDC01	SYNC_FAILED	EDC01-176518
439	2026-05-25 11:03:28.264744	EDC01	SYNC_FAILED	EDC01-176518
440	2026-05-25 11:03:38.13256	EDC01	SYNC_FAILED	EDC01-176518
441	2026-05-25 11:04:00.829725	EDC01	SYNC_FAILED	EDC01-176518
442	2026-05-25 11:04:06.57515	EDC01	SYNC_FAILED	EDC01-176518
443	2026-05-25 11:04:16.407793	EDC01	SYNC_FAILED	EDC01-176518
444	2026-05-25 11:04:26.318334	EDC01	SYNC_FAILED	EDC01-176518
445	2026-05-25 11:04:38.825314	EDC01	SYNC_FAILED	EDC01-176518
446	2026-05-25 11:04:46.5179	EDC01	SYNC_FAILED	EDC01-176518
447	2026-05-25 11:04:56.654233	EDC01	SYNC_FAILED	EDC01-176518
448	2026-05-25 11:05:06.780612	EDC01	SYNC_FAILED	EDC01-176518
449	2026-05-25 11:05:18.45666	EDC01	SYNC_FAILED	EDC01-176518
450	2026-05-25 11:05:28.615972	EDC01	SYNC_FAILED	EDC01-176518
451	2026-05-25 11:05:38.73031	EDC01	SYNC_FAILED	EDC01-176518
452	2026-05-25 11:05:48.867883	EDC01	SYNC_FAILED	EDC01-176518
453	2026-05-25 11:05:56.480337	EDC01	SYNC_FAILED	EDC01-176518
454	2026-05-25 11:06:06.526721	EDC01	SYNC_FAILED	EDC01-176518
455	2026-05-25 11:06:18.666688	EDC01	SYNC_FAILED	EDC01-176518
456	2026-05-25 11:06:28.908847	EDC01	SYNC_FAILED	EDC01-176518
457	2026-05-25 11:06:38.674254	EDC01	SYNC_FAILED	EDC01-176518
458	2026-05-25 11:06:58.923112	EDC01	SYNC_FAILED	EDC01-176518
459	2026-05-25 11:07:07.819119	EDC01	SYNC_FAILED	EDC01-176518
460	2026-05-25 11:07:16.890331	EDC01	SYNC_FAILED	EDC01-176518
461	2026-05-25 11:07:26.665545	EDC01	SYNC_FAILED	EDC01-176518
462	2026-05-25 11:07:38.537299	EDC01	SYNC_FAILED	EDC01-176518
463	2026-05-25 11:07:47.753524	EDC01	SYNC_FAILED	EDC01-176518
464	2026-05-25 11:07:58.516837	EDC01	SYNC_FAILED	EDC01-176518
465	2026-05-25 11:08:08.02876	EDC01	SYNC_FAILED	EDC01-176518
466	2026-05-25 11:08:16.943021	EDC01	SYNC_FAILED	EDC01-176518
467	2026-05-25 11:08:37.974211	EDC01	SYNC_FAILED	EDC01-176518
468	2026-05-25 11:08:48.924072	EDC01	SYNC_FAILED	EDC01-176518
469	2026-05-25 11:08:59.088246	EDC01	SYNC_FAILED	EDC01-176518
470	2026-05-25 11:09:08.245615	EDC01	SYNC_FAILED	EDC01-176518
471	2026-05-25 11:09:17.764947	EDC01	SYNC_FAILED	EDC01-176518
472	2026-05-25 11:09:27.401934	EDC01	SYNC_FAILED	EDC01-176518
473	2026-05-25 11:09:36.92781	EDC01	SYNC_FAILED	EDC01-176518
474	2026-05-25 11:09:47.884757	EDC01	SYNC_FAILED	EDC01-176518
475	2026-05-25 11:09:58.020589	EDC01	SYNC_FAILED	EDC01-176518
476	2026-05-25 11:10:08.463538	EDC01	SYNC_FAILED	EDC01-176518
477	2026-05-25 11:10:19.817314	EDC01	SYNC_FAILED	EDC01-176518
478	2026-05-25 11:10:27.043129	EDC01	SYNC_FAILED	EDC01-176518
479	2026-05-25 11:10:36.926765	EDC01	SYNC_FAILED	EDC01-176518
480	2026-05-25 11:11:09.579625	EDC01	BOOT	device started
481	2026-05-25 11:11:09.902942	EDC01	WIFI_ON	wifi connected
482	2026-05-25 11:11:17.427719	EDC01	SYNC_FAILED	EDC01-176518
483	2026-05-25 11:11:28.016682	EDC01	SYNC_FAILED	EDC01-176518
484	2026-05-25 11:11:38.56006	EDC01	SYNC_FAILED	EDC01-176518
485	2026-05-25 11:11:48.075692	EDC01	SYNC_FAILED	EDC01-176518
486	2026-05-25 11:11:57.69816	EDC01	SYNC_FAILED	EDC01-176518
487	2026-05-25 11:12:06.728792	EDC01	PAYMENT	d13ef206 | Rp 500
488	2026-05-25 11:12:07.3984	EDC01	SYNC_FAILED	EDC01-176518
489	2026-05-25 11:12:17.914755	EDC01	SYNC_FAILED	EDC01-176518
490	2026-05-25 11:12:27.311997	EDC01	SYNC_FAILED	EDC01-176518
491	2026-05-25 11:12:39.290444	EDC01	SYNC_FAILED	EDC01-176518
492	2026-05-25 11:12:47.671339	EDC01	SYNC_FAILED	EDC01-176518
493	2026-05-25 11:12:58.283169	EDC01	SYNC_FAILED	EDC01-176518
494	2026-05-25 11:13:07.346043	EDC01	SYNC_FAILED	EDC01-176518
495	2026-05-25 11:13:18.210829	EDC01	SYNC_FAILED	EDC01-176518
496	2026-05-25 11:13:28.207081	EDC01	SYNC_FAILED	EDC01-176518
497	2026-05-25 11:13:37.666593	EDC01	SYNC_FAILED	EDC01-176518
498	2026-05-25 11:13:49.64332	EDC01	SYNC_FAILED	EDC01-176518
499	2026-05-25 11:13:57.497052	EDC01	SYNC_FAILED	EDC01-176518
500	2026-05-25 11:14:07.469771	EDC01	SYNC_FAILED	EDC01-176518
501	2026-05-25 11:14:19.756164	EDC01	SYNC_FAILED	EDC01-176518
502	2026-05-25 11:14:30.188566	EDC01	SYNC_FAILED	EDC01-176518
503	2026-05-25 11:14:38.211607	EDC01	SYNC_FAILED	EDC01-176518
504	2026-05-25 11:14:47.816635	EDC01	SYNC_FAILED	EDC01-176518
505	2026-05-25 11:14:57.530855	EDC01	SYNC_FAILED	EDC01-176518
506	2026-05-25 11:15:09.821749	EDC01	SYNC_FAILED	EDC01-176518
507	2026-05-25 11:15:19.339071	EDC01	SYNC_FAILED	EDC01-176518
508	2026-05-25 11:15:27.728217	EDC01	SYNC_FAILED	EDC01-176518
509	2026-05-25 11:15:38.751746	EDC01	SYNC_FAILED	EDC01-176518
510	2026-05-25 11:15:48.840936	EDC01	SYNC_FAILED	EDC01-176518
511	2026-05-25 11:15:58.253388	EDC01	SYNC_FAILED	EDC01-176518
512	2026-05-25 11:16:07.713089	EDC01	SYNC_FAILED	EDC01-176518
513	2026-05-25 11:16:17.819877	EDC01	SYNC_FAILED	EDC01-176518
514	2026-05-25 11:16:30.005123	EDC01	SYNC_FAILED	EDC01-176518
515	2026-05-25 11:16:39.418105	EDC01	SYNC_FAILED	EDC01-176518
516	2026-05-25 11:16:48.127546	EDC01	SYNC_FAILED	EDC01-176518
517	2026-05-25 11:16:57.758334	EDC01	SYNC_FAILED	EDC01-176518
518	2026-05-25 11:17:10.834992	EDC01	SYNC_FAILED	EDC01-176518
519	2026-05-25 11:17:18.063762	EDC01	SYNC_FAILED	EDC01-176518
520	2026-05-25 11:17:30.228923	EDC01	SYNC_FAILED	EDC01-176518
521	2026-05-25 11:17:37.742051	EDC01	SYNC_FAILED	EDC01-176518
522	2026-05-25 11:17:47.807593	EDC01	SYNC_FAILED	EDC01-176518
523	2026-05-25 11:18:00.004958	EDC01	SYNC_FAILED	EDC01-176518
524	2026-05-25 11:18:10.75703	EDC01	SYNC_FAILED	EDC01-176518
525	2026-05-25 11:18:17.829003	EDC01	SYNC_FAILED	EDC01-176518
526	2026-05-25 11:18:28.890177	EDC01	SYNC_FAILED	EDC01-176518
527	2026-05-25 11:18:40.862981	EDC01	SYNC_FAILED	EDC01-176518
528	2026-05-25 11:18:48.320842	EDC01	SYNC_FAILED	EDC01-176518
529	2026-05-25 11:18:57.942183	EDC01	SYNC_FAILED	EDC01-176518
530	2026-05-25 11:19:09.444756	EDC01	SYNC_FAILED	EDC01-176518
531	2026-05-25 11:19:23.402892	EDC01	SYNC_FAILED	EDC01-176518
532	2026-05-25 11:19:28.026273	EDC01	SYNC_FAILED	EDC01-176518
533	2026-05-25 11:19:54.571481	EDC01	SYNC_FAILED	EDC01-176518
534	2026-05-25 11:20:03.709363	EDC01	SYNC_FAILED	EDC01-176518
535	2026-05-25 11:20:13.239072	EDC01	SYNC_FAILED	EDC01-176518
536	2026-05-25 11:20:23.173754	EDC01	SYNC_FAILED	EDC01-176518
537	2026-05-25 11:20:32.999621	EDC01	SYNC_FAILED	EDC01-176518
538	2026-05-25 11:20:46.904082	EDC01	SYNC_FAILED	EDC01-176518
539	2026-05-25 11:20:54.192685	EDC01	SYNC_FAILED	EDC01-176518
540	2026-05-25 11:21:03.404149	EDC01	SYNC_FAILED	EDC01-176518
541	2026-05-25 11:21:12.783831	EDC01	SYNC_FAILED	EDC01-176518
542	2026-05-25 11:21:23.237538	EDC01	SYNC_FAILED	EDC01-176518
543	2026-05-25 11:21:35.967418	EDC01	SYNC_FAILED	EDC01-176518
544	2026-05-25 11:21:55.329903	EDC01	SYNC_FAILED	EDC01-176518
545	2026-05-25 11:22:03.055592	EDC01	SYNC_FAILED	EDC01-176518
546	2026-05-25 11:22:15.903462	EDC01	SYNC_FAILED	EDC01-176518
547	2026-05-25 11:22:24.504021	EDC01	SYNC_FAILED	EDC01-176518
548	2026-05-25 11:22:34.949951	EDC01	SYNC_FAILED	EDC01-176518
549	2026-05-25 11:22:42.915312	EDC01	SYNC_FAILED	EDC01-176518
550	2026-05-25 11:22:54.747025	EDC01	SYNC_FAILED	EDC01-176518
551	2026-05-25 11:23:05.059573	EDC01	SYNC_FAILED	EDC01-176518
552	2026-05-25 11:23:15.534275	EDC01	SYNC_FAILED	EDC01-176518
553	2026-05-25 11:23:24.052374	EDC01	SYNC_FAILED	EDC01-176518
554	2026-05-25 11:23:33.641581	EDC01	SYNC_FAILED	EDC01-176518
555	2026-05-25 11:23:45.615291	EDC01	SYNC_FAILED	EDC01-176518
556	2026-05-25 11:23:55.062838	EDC01	SYNC_FAILED	EDC01-176518
557	2026-05-25 11:24:13.754251	EDC01	SYNC_FAILED	EDC01-176518
558	2026-05-25 11:24:23.248435	EDC01	SYNC_FAILED	EDC01-176518
559	2026-05-25 11:24:33.535111	EDC01	SYNC_FAILED	EDC01-176518
560	2026-05-25 11:24:43.372082	EDC01	SYNC_FAILED	EDC01-176518
561	2026-05-25 11:24:53.148811	EDC01	SYNC_FAILED	EDC01-176518
562	2026-05-25 11:25:03.186949	EDC01	SYNC_FAILED	EDC01-176518
563	2026-05-25 11:25:16.231319	EDC01	SYNC_FAILED	EDC01-176518
564	2026-05-25 11:25:24.842417	EDC01	SYNC_FAILED	EDC01-176518
565	2026-05-25 11:25:47.736036	EDC01	SYNC_FAILED	EDC01-176518
566	2026-05-25 11:25:53.387861	EDC01	SYNC_FAILED	EDC01-176518
567	2026-05-25 11:26:13.991069	EDC01	SYNC_FAILED	EDC01-176518
568	2026-05-25 11:26:25.965838	EDC01	SYNC_FAILED	EDC01-176518
569	2026-05-25 11:26:35.675877	EDC01	SYNC_FAILED	EDC01-176518
570	2026-05-25 11:26:45.941251	EDC01	SYNC_FAILED	EDC01-176518
571	2026-05-25 11:26:53.781756	EDC01	SYNC_FAILED	EDC01-176518
572	2026-05-25 11:27:03.766386	EDC01	SYNC_FAILED	EDC01-176518
573	2026-05-25 11:27:13.627102	EDC01	SYNC_FAILED	EDC01-176518
574	2026-05-25 11:27:36.847247	EDC01	SYNC_FAILED	EDC01-176518
575	2026-05-25 11:27:45.243304	EDC01	SYNC_FAILED	EDC01-176518
576	2026-05-25 11:27:55.171898	EDC01	SYNC_FAILED	EDC01-176518
577	2026-05-25 11:28:04.268352	EDC01	SYNC_FAILED	EDC01-176518
578	2026-05-25 11:28:15.1251	EDC01	SYNC_FAILED	EDC01-176518
579	2026-05-25 11:28:24.544633	EDC01	SYNC_FAILED	EDC01-176518
580	2026-05-25 11:28:36.52536	EDC01	SYNC_FAILED	EDC01-176518
581	2026-05-25 11:28:44.285873	EDC01	SYNC_FAILED	EDC01-176518
582	2026-05-25 11:28:54.042266	EDC01	SYNC_FAILED	EDC01-176518
583	2026-05-25 11:29:04.870687	EDC01	SYNC_FAILED	EDC01-176518
584	2026-05-25 11:29:14.415313	EDC01	SYNC_FAILED	EDC01-176518
585	2026-05-25 11:29:25.678131	EDC01	SYNC_FAILED	EDC01-176518
586	2026-05-25 11:29:33.978688	EDC01	SYNC_FAILED	EDC01-176518
587	2026-05-25 11:29:46.566838	EDC01	SYNC_FAILED	EDC01-176518
588	2026-05-25 11:29:53.772882	EDC01	SYNC_FAILED	EDC01-176518
589	2026-05-25 11:30:15.46574	EDC01	SYNC_FAILED	EDC01-176518
590	2026-05-25 11:30:24.607921	EDC01	SYNC_FAILED	EDC01-176518
591	2026-05-25 11:30:34.803821	EDC01	SYNC_FAILED	EDC01-176518
592	2026-05-25 11:30:44.705853	EDC01	SYNC_FAILED	EDC01-176518
593	2026-05-25 11:31:25.895039	EDC01	BOOT	device started
594	2026-05-25 11:31:26.713477	EDC01	WIFI_ON	wifi connected
595	2026-05-25 11:31:33.522944	EDC01	SYNC_FAILED	EDC01-176518
596	2026-05-25 11:31:43.940394	EDC01	SYNC_FAILED	EDC01-176518
597	2026-05-25 11:31:54.07842	EDC01	SYNC_FAILED	EDC01-176518
598	2026-05-25 11:32:04.80619	EDC01	SYNC_FAILED	EDC01-176518
599	2026-05-25 11:32:15.86545	EDC01	SYNC_FAILED	EDC01-176518
600	2026-05-25 11:32:23.928799	EDC01	SYNC_FAILED	EDC01-176518
601	2026-05-25 11:32:58.454772	EDC01	WIFI_ON	wifi connected
602	2026-05-25 11:32:59.038656	EDC01	BOOT	device started
603	2026-05-25 11:33:06.970214	EDC01	SYNC_FAILED	EDC01-176518
604	2026-05-25 11:33:19.457194	EDC01	SYNC_FAILED	EDC01-176518
605	2026-05-25 11:33:27.846377	EDC01	SYNC_FAILED	EDC01-176518
606	2026-05-25 11:33:37.889219	EDC01	SYNC_FAILED	EDC01-176518
607	2026-05-25 11:33:57.740751	EDC01	SYNC_FAILED	EDC01-176518
608	2026-05-25 11:34:09.641725	EDC01	SYNC_FAILED	EDC01-176518
609	2026-05-25 11:34:17.976759	EDC01	SYNC_FAILED	EDC01-176518
610	2026-05-25 11:34:27.661994	EDC01	SYNC_FAILED	EDC01-176518
611	2026-05-25 11:34:37.184982	EDC01	SYNC_FAILED	EDC01-176518
612	2026-05-25 11:34:47.62297	EDC01	SYNC_FAILED	EDC01-176518
613	2026-05-25 11:34:58.385656	EDC01	SYNC_FAILED	EDC01-176518
614	2026-05-25 11:35:07.993626	EDC01	SYNC_FAILED	EDC01-176518
615	2026-05-25 11:35:18.129755	EDC01	SYNC_FAILED	EDC01-176518
616	2026-05-25 11:35:28.062634	EDC01	SYNC_FAILED	EDC01-176518
617	2026-05-25 11:35:37.861049	EDC01	SYNC_FAILED	EDC01-176518
618	2026-05-25 11:36:20.937496	EDC01	BOOT	device started
619	2026-05-25 11:36:21.517419	EDC01	WIFI_ON	wifi connected
620	2026-05-25 11:38:36.328652	EDC01	BOOT	device started
621	2026-05-25 11:38:37.12102	EDC01	WIFI_ON	wifi connected
622	2026-05-25 11:42:32.419632	EDC01	PAYMENT	d13ef206 | Rp 9500
623	2026-05-25 11:43:39.096616	EDC01	TOPUP	d13ef206 | Rp 4500
624	2026-05-26 14:03:21.36255	EDC01	BOOT	device started
625	2026-05-26 14:03:21.472276	EDC01	WIFI_ON	wifi connected
626	2026-05-26 17:24:59.968635	EDC01	WIFI_ON	wifi connected
627	2026-05-26 17:40:39.244714	EDC01	WIFI_ON	wifi connected
628	2026-06-03 14:03:10.898027	EDC01	WIFI_ON	wifi connected
629	2026-06-03 14:03:11.025023	EDC01	BOOT	device started
630	2026-06-03 14:41:20.571901	EDC01	WIFI_ON	wifi connected
631	2026-06-03 14:54:53.413482	EDC01	WIFI_ON	wifi connected
632	2026-06-03 16:20:40.300571	BACKEND	RFID_TOPUP	Raihana Inarotur R | Rp 10000
633	2026-06-03 16:32:15.041434	BACKEND	RFID_TOPUP	Raihana Inarotur R | Rp 10000
666	2026-06-04 11:28:13.882453	EDC01	BOOT	device started
667	2026-06-04 11:28:15.30804	EDC01	WIFI_ON	wifi connected
668	2026-06-04 11:38:11.890473	EDC01	BOOT	device started
669	2026-06-04 11:38:12.055732	EDC01	WIFI_ON	wifi connected
670	2026-06-04 13:12:33.518778	EDC01	TOPUP	352721e0 | Rp 100000
671	2026-06-04 13:12:56.952865	EDC01	TOPUP	fadbace4 | Rp 150000
672	2026-06-04 13:36:06.946886	EDC01	PAYMENT	fadbace4 | Rp 1000
673	2026-06-04 13:37:03.87249	EDC01	PAYMENT	fadbace4 | Rp 2500
674	2026-06-04 13:39:15.055641	EDC01	PAYMENT	d13ef206 | Rp 2000
675	2026-06-04 13:43:42.802676	BACKEND	RFID_REFUND	TRX TEST-001
676	2026-06-04 14:10:56.499306	BACKEND	RFID_REFUND	TRX SYNC003
677	2026-06-04 14:43:41.288211	EDC01	WIFI_ON	wifi connected
678	2026-06-04 14:44:53.250041	EDC01	BOOT	device started
679	2026-06-04 14:44:53.709356	EDC01	WIFI_ON	wifi connected
680	2026-06-04 14:45:11.492696	EDC01	PAYMENT	fadbace4 | Rp 2500
681	2026-06-04 14:46:39.036486	BACKEND	RFID_TOPUP	Ahmad As'ad | Rp 1000
682	2026-06-04 14:46:50.403556	BACKEND	RFID_TOPUP	Abdillah hilhad | Rp 1000
683	2026-06-04 14:47:18.878464	EDC01	PAYMENT	fadbace4 | Rp 500
684	2026-06-04 15:14:04.616031	EDC01	PAYMENT	352721e0 | Rp 5000
685	2026-06-04 15:32:21.77647	EDC01	PAYMENT	352721e0 | Rp 500
686	2026-06-04 15:32:46.546617	EDC01	PAYMENT	d13ef206 | Rp 500
687	2026-06-04 16:12:08.571089	EDC01	PAYMENT	fadbace4 | Rp 500
688	2026-06-04 16:15:41.155872	EDC01	PAYMENT	fadbace4 | Rp 500
689	2026-06-04 16:17:18.842406	EDC01	PAYMENT	fadbace4 | Rp 500
690	2026-06-04 16:46:57.051178	EDC01	WIFI_ON	wifi connected
691	2026-06-04 16:49:20.386681	EDC01	PAYMENT	fadbace4 | Rp 500
692	2026-06-04 16:53:41.505016	EDC01	PAYMENT	352721e0 | Rp 500
693	2026-06-04 16:54:11.333866	EDC01	PAYMENT	d13ef206 | Rp 500
694	2026-06-04 16:54:52.157058	EDC01	TOPUP	fadbace4 | Rp 500
\.


--
-- Data for Name: buku_kas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.buku_kas (id, tanggal, jenis, kategori, keterangan, nominal, petugas, created_at) FROM stdin;
4	2026-05-24	Masuk	donasi		500000	aiki	2026-05-29 18:20:15.960108
1	2026-05-27	Masuk	Donasi	Dari hamba alloh	1000000	Aiki	2026-05-29 17:31:54.65585
6	2026-04-29	Masuk	donasi		250000		2026-05-29 22:35:10.221906
7	2026-05-30	Masuk	Sahriyah	Pembayaran Sahriyah	150000	Bendahara	2026-05-30 19:35:10.166439
8	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah	150000	Aiky	2026-05-31 09:15:28.428469
9	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah	150000	Aiky	2026-05-31 09:29:40.38196
10	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah	50000	Aiky	2026-05-31 09:59:34.363837
11	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah	50000	Aiky	2026-05-31 10:19:35.30394
12	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah	75000	Aiky	2026-05-31 10:20:48.8753
13	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah	75000	Aiky	2026-05-31 10:22:01.585554
14	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah	50000	Aiky	2026-05-31 10:23:59.085523
15	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah	100000	Aiky	2026-05-31 10:29:20.238348
16	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah	25000	Aiky	2026-05-31 10:39:07.248436
17	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah	75000	Aiky	2026-05-31 10:55:00.59151
18	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah - Raihana Inarotur R	50000	Aiky	2026-05-31 13:00:04.219581
19	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah - Ahmad As'ad	25000	Aiky	2026-05-31 13:02:21.677054
20	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah - Raihana Inarotur R	25000	Aiky	2026-05-31 13:21:54.014259
21	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah - Abdillah hilhad	25000	Aiky	2026-05-31 13:23:24.618542
22	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah - Ahmad As'ad	25000	Aiky	2026-05-31 13:24:12.122238
23	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah - Abdillah hilhad	25000	Aiky	2026-05-31 13:25:25.665563
24	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah - Raihana Inarotur R	25000	Aiky	2026-05-31 13:26:14.410182
25	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah - Ahmad As'ad	50000	Aiky	2026-05-31 13:27:34.401926
26	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah - Raihana Inarotur R	200000	Aiky	2026-05-31 13:32:12.9068
27	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah - Abdillah hilhad	50000	Aiky	2026-05-31 13:37:05.666011
28	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah - Ahmad As'ad	10000	Aiky	2026-05-31 13:39:54.563268
29	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah - Abdillah hilhad	10000	Aiky	2026-05-31 13:44:02.832186
30	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah - Abdillah hilhad	40000	Aiky	2026-05-31 13:48:02.470087
31	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah - Ahmad As'ad	40000	Aiky	2026-05-31 13:49:44.861654
32	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah - Ahmad As'ad	25000	Aiky	2026-05-31 20:13:45.514194
33	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah - Ahmad As'ad	10000	Aiky	2026-05-31 20:15:49.713942
34	2026-05-31	Masuk	Sahriyah	Pembayaran Sahriyah - Ahmad As'ad	10000	Aiky	2026-05-31 20:20:16.394562
78	2026-06-02	Masuk	Sahriyah	Pembayaran Sahriyah - Ahmad As'ad	25000	Aiky	2026-06-02 13:57:11.177606
79	2026-06-02	Masuk	Sahriyah	Pembayaran Sahriyah - Abdillah hilhad	25000	Aiky	2026-06-02 14:00:57.096662
80	2026-06-02	Masuk	Sahriyah	Pembayaran Sahriyah - Raihana Inarotur R	25000	Aiky	2026-06-02 14:07:24.189869
81	2026-06-02	Masuk	Sahriyah	Pembayaran Sahriyah - Ahmad As'ad	25000	Aiky	2026-06-02 14:10:31.909757
82	2026-06-02	Masuk	Sahriyah	Pembayaran Sahriyah - Raihana Inarotur R	25000	Aiky	2026-06-02 14:12:04.538172
83	2026-06-02	Masuk	Sahriyah	Pembayaran Sahriyah - Ahmad As'ad	25000	Aiky	2026-06-02 14:14:25.817708
84	2026-06-02	Masuk	Sahriyah	Pembayaran Sahriyah - Abdillah hilhad	25000	Aiky	2026-06-02 14:24:31.691444
85	2026-06-02	Masuk	Sahriyah	Pembayaran Sahriyah - Raihana Inarotur R	25000	Aiky	2026-06-02 14:27:02.815353
86	2026-06-02	Masuk	Sahriyah	Pembayaran Sahriyah - Ahmad As'ad	25000	Aiky	2026-06-02 14:31:24.589552
87	2026-06-02	Masuk	Sahriyah	Pembayaran Sahriyah - Abdillah hilhad	25000	Aiky	2026-06-02 14:34:23.533202
88	2026-06-02	Masuk	Sahriyah	Pembayaran Sahriyah - Raihana Inarotur R	25000	Aiky	2026-06-02 14:37:33.472981
89	2026-06-02	Masuk	Sahriyah	Pembayaran Sahriyah - Ahmad As'ad	25000	Aiky	2026-06-02 14:38:53.560967
90	2026-06-02	Masuk	Sahriyah	Pembayaran Sahriyah - Abdillah hilhad	25000	Aiky	2026-06-02 14:39:25.406532
91	2026-06-02	Masuk	Sahriyah	Pembayaran Sahriyah - Raihana Inarotur R	125000	Aiky	2026-06-02 14:40:23.908696
92	2026-06-02	Masuk	Sahriyah	Pembayaran Sahriyah - Raihana Inarotur R	50000	Aiky	2026-06-02 14:48:01.10888
93	2026-06-02	Keluar	Operasional		20000	Suci	2026-06-02 14:57:03.966363
94	2026-06-02	Keluar	Air		40000	Suci	2026-06-02 14:59:49.176516
95	2026-06-02	Keluar	Lainnya	Keni Paralon	20000	Suci	2026-06-02 15:01:27.491333
99	2026-06-03	Masuk	RFID Topup	Raihana Inarotur R	10000	\N	2026-06-03 16:20:40.300571
100	2026-06-03	Masuk	RFID Topup	Raihana Inarotur R	10000	\N	2026-06-03 16:32:15.041434
133	2026-06-04	Masuk	RFID Topup	Ahmad As'ad	1000	\N	2026-06-04 14:46:39.036486
134	2026-06-04	Masuk	RFID Topup	Abdillah hilhad	1000	\N	2026-06-04 14:46:50.403556
135	2026-06-09	Masuk	Sahriyah	Pembayaran Sahriyah - Raihana Inarotur R	75000	Aiky	2026-06-09 10:46:19.725833
136	2026-06-09	Masuk	Pembayaran	SERAGAM SILAT - Raihana Inarotur R	200000	Aiky	2026-06-09 19:10:16.249305
137	2026-06-09	Masuk	Sahriyah	Pembayaran Sahriyah - Ahmad As'ad	125000	Aiky	2026-06-09 19:12:13.716165
138	2026-06-09	Masuk	Sahriyah	Pembayaran Sahriyah - Abdillah hilhad	125000	Aiky	2026-06-09 19:13:21.316872
139	2026-06-09	Masuk	Pembayaran	Kas - Raihana Inarotur R	20000	Aiky	2026-06-09 21:48:29.04001
140	2026-06-13	Masuk	Pembayaran	SERAGAM SILAT - Ahmad As'ad	200000	Super Admin	2026-06-13 00:05:59.765839
141	2026-06-13	Masuk	Pembayaran	PHBI - Raihana Inarotur R	7500	Super Admin	2026-06-13 00:06:24.367874
\.


--
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.devices (id, device_id, device_secret, nama_device, status, created_at, last_ping, ip_address, merchant_id, lokasi, firmware_version, last_sync) FROM stdin;
4	EDC02	\N	EDC02	offline	2026-05-23 16:21:34.220266	\N	\N	1	\N	\N	\N
2051	EDC03	c3a98a3dcccb575f41af7fd54c46ae1e73966d0d9b6b9951080cfb68670c66bc	EDC03	offline	2026-06-03 10:24:27.628992	2026-06-03 13:15:25.845078	::ffff:127.0.0.1	1	\N	1.0.0	2026-06-03 14:23:31.305294
3	EDC01	SECRET123	EDC01	offline	2026-05-23 14:16:04.323561	2026-06-04 16:57:25.916615	::ffff:10.105.143.34	1	\N	\N	\N
\.


--
-- Data for Name: guru; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.guru (id, nama, jabatan, nomor_hp, email, alamat, tanggal_masuk, status, catatan, created_at) FROM stdin;
2	Ustadzah Fatimah	Guru Tahfidz	\N	\N	\N	\N	Aktif	\N	2026-06-11 00:31:23.781077
1	Ustadz Ahmad	Wali Kelas	\N	\N	\N	2026-06-01	Aktif	\N	2026-06-11 00:31:23.781077
\.


--
-- Data for Name: hafalan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hafalan (id, santri_id, tanggal, kitab, awal, akhir, catatan, created_at, pekan, bulan, tahun) FROM stdin;
1	1	2026-05-29	Alfiyah	10	50	Lancar	2026-05-29 13:28:11.932086	1	5	2026
2	1	2026-05-29	Alfiyah	50	100	Lancar	2026-05-29 13:31:14.504035	2	5	2026
5	12	2026-06-13	Jauhar Maknun	Bait 05	Bait 50	Lancar	2026-06-09 19:18:44.043164	1	6	2026
4	1	2026-06-13	Alfiyah	100	150	Lancar	2026-06-09 19:18:44.037067	1	6	2026
3	1	2026-06-13	Alfiyah	150	200	Lancar	2026-06-09 19:18:44.023738	2	6	2026
6	13	2026-06-13	Sahadattaen	awal	segat tasdeq	lancar	2026-06-13 07:17:45.164485	1	6	2026
7	13	2026-06-13	sahadattaen	segat tasdeq	sahadat saran	lancar	2026-06-13 07:17:45.173056	2	6	2026
\.


--
-- Data for Name: jenis_tagihan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jenis_tagihan (id, nama_tagihan, is_bulanan, created_at) FROM stdin;
1	Syahriyah	t	2026-05-28 08:16:40.467382
2	Seragam	f	2026-05-28 08:16:40.467382
3	Kitab	f	2026-05-28 08:16:40.467382
4	Daftar Ulang	f	2026-05-28 08:16:40.467382
\.


--
-- Data for Name: kelas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kelas (id, nama_kelas, created_at) FROM stdin;
1	1 Ibtida	2026-05-26 13:28:24.287821
2	2 Ibtida	2026-05-26 13:28:24.287821
3	3 Ibtida	2026-05-26 13:28:24.287821
4	1 Tsanawi	2026-05-26 13:28:24.287821
5	2 Tsanawi	2026-05-26 13:28:24.287821
6	3 Tsanawi	2026-05-26 13:28:24.287821
\.


--
-- Data for Name: kesehatan_santri; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kesehatan_santri (id, santri_id, status_kesehatan, keluhan, tindakan_pertama, status_penanganan, created_by, created_at, updated_at) FROM stdin;
1	1	sakit	Pusing/Demam	Minum bodrek	sudah_berobat	1	2026-06-14 21:48:24.397633	2026-06-14 21:50:11.205066
\.


--
-- Data for Name: merchant_rfid; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.merchant_rfid (id, nama_merchant, status, created_at) FROM stdin;
1	Kantin Putra	t	2026-06-03 10:09:03.087927
\.


--
-- Data for Name: nilai_mingguan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nilai_mingguan (id, santri_id, tanggal, mapel, nilai, catatan, created_at, bulan, tahun) FROM stdin;
1	1	2026-05-29	Nahwu	70	\N	2026-05-29 13:28:23.693422	5	2026
2	1	2026-05-29	Fiqih	90	\N	2026-05-29 13:31:37.558112	5	2026
6	12	2026-06-12	Fiqih	70	\N	2026-06-13 00:03:19.994178	6	2026
5	12	2026-06-12	Nahwu	40	\N	2026-06-13 00:03:11.984641	6	2026
4	1	2026-06-12	Fiqih	90	\N	2026-06-09 21:51:27.088174	6	2026
3	1	2026-06-12	Nahwu	80	\N	2026-06-09 21:51:27.078665	6	2026
7	13	2026-06-12	Nahwu	60	\N	2026-06-13 00:03:30.564175	6	2026
8	13	2026-06-12	Fiqih	50	\N	2026-06-13 00:03:30.569509	6	2026
\.


--
-- Data for Name: pelanggaran; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pelanggaran (id, santri_id, tanggal, jenis, poin, catatan, tindakan, created_at, jam, tingkat, petugas) FROM stdin;
5	1	2026-05-26	Tidak ngaji	35		Push-up 20	2026-05-29 15:29:54.179506	15:29:00	Sedang	Gojali
6	12	2026-06-05	Merokok	50	Harus diperingati orang tua	Direndam di kolam	2026-06-05 21:38:33.810294	21:38:00	Berat	Aiky
7	1	2026-06-09	Tidak Pake Ciput	10		Tajir di kobong	2026-06-09 11:39:53.740306	11:39:00	Ringan	Afipah
9	13	2026-06-09	Merokok	20		Tajir	2026-06-09 12:52:28.11032	12:51:00	Sedang	Aiky
10	13	2026-06-09	Merokok	20		Tajir	2026-06-09 13:37:39.631746	13:37:00	Sedang	Aiky
11	13	2026-06-09	Merokok	20		Tajir	2026-06-09 19:27:50.015971	19:27:00	Sedang	Aiky
\.


--
-- Data for Name: pembayaran; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pembayaran (id, santri_id, jenis_tagihan_id, bulan, tahun, nominal_tagihan, nominal_bayar, sisa_tunggakan, status, catatan, tanggal_bayar, created_at, sisa_tagihan, nama_tagihan) FROM stdin;
16	1	\N	Juni	2026	199998	200000	0	lunas	\N	2026-06-09 00:00:00	2026-06-09 19:09:50.786028	0	SERAGAM SILAT
17	1	\N	Juni	2026	20000	20000	0	lunas	\N	2026-06-09 00:00:00	2026-06-09 21:48:10.423464	0	Kas
15	12	\N	Juni	2026	200000	200000	0	lunas	\N	2026-06-13 00:00:00	2026-06-09 19:06:17.797945	0	SERAGAM SILAT
14	1	\N	Juni	2026	10000	10000	0	lunas	\N	2026-06-13 00:00:00	2026-06-01 11:26:46.53195	0	PHBI
\.


--
-- Data for Name: pembayaran_detail; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pembayaran_detail (id, pembayaran_id, tanggal, nominal, petugas, created_at) FROM stdin;
16	14	2026-06-01	1000	Aiky	2026-06-01 11:26:56.954233
17	14	2026-06-01	1000	Aiky	2026-06-01 11:27:33.64675
18	14	2026-06-01	500	Aiky	2026-06-01 11:31:50.177306
19	16	2026-06-09	200000	Aiky	2026-06-09 19:10:16.243112
20	17	2026-06-09	20000	Aiky	2026-06-09 21:48:29.034505
21	15	2026-06-13	200000	Super Admin	2026-06-13 00:05:59.759528
22	14	2026-06-13	7500	Super Admin	2026-06-13 00:06:24.365685
\.


--
-- Data for Name: pembayaran_sahriyah; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pembayaran_sahriyah (id, tagihan_id, tanggal, nominal, petugas, created_at, nominal_beras) FROM stdin;
53	22	2026-06-02	25000	Aiky	2026-06-02 13:56:26.67625	1.00
54	23	2026-06-02	25000	Aiky	2026-06-02 13:57:11.175579	1.00
55	24	2026-06-02	25000	Aiky	2026-06-02 14:00:57.084971	1.00
56	22	2026-06-02	25000	Aiky	2026-06-02 14:07:24.187757	1.00
57	23	2026-06-02	25000	Aiky	2026-06-02 14:10:31.907919	1.00
58	22	2026-06-02	25000	Aiky	2026-06-02 14:12:04.536311	1.00
59	23	2026-06-02	25000	Aiky	2026-06-02 14:14:25.815184	1.00
60	24	2026-06-02	25000	Aiky	2026-06-02 14:24:31.689061	1.00
61	22	2026-06-02	25000	Aiky	2026-06-02 14:27:02.813357	1.00
62	23	2026-06-02	25000	Aiky	2026-06-02 14:31:24.587749	1.00
63	24	2026-06-02	25000	Aiky	2026-06-02 14:34:23.531118	1.00
64	22	2026-06-02	25000	Aiky	2026-06-02 14:37:33.470981	1.00
65	23	2026-06-02	25000	Aiky	2026-06-02 14:38:53.559079	1.00
66	24	2026-06-02	25000	Aiky	2026-06-02 14:39:25.404658	1.00
67	25	2026-06-02	125000	Aiky	2026-06-02 14:40:23.906935	5.00
68	22	2026-06-02	50000	Aiky	2026-06-02 14:48:01.100152	2.00
69	22	2026-06-09	75000	Aiky	2026-06-09 10:46:19.709456	3.00
70	23	2026-06-09	125000	Aiky	2026-06-09 19:12:13.705542	5.00
71	24	2026-06-09	125000	Aiky	2026-06-09 19:13:21.314469	5.00
52	24	2026-06-02	25000	Aiky	2026-06-02 13:55:30.941228	1.00
\.


--
-- Data for Name: pengumuman; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pengumuman (id, judul, isi, prioritas, published_at, expires_at, is_active, created_by, created_at, cover_url) FROM stdin;
4	TAHUN BARU ISLAM	Muharaman	normal	2026-06-14 11:39:02.727239	\N	t	\N	2026-06-14 11:39:02.727239	data:image/jpeg;base64,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C415HJ3CI2n5yrqueXNhPdfYwd1V0Xw/Rfb9cNY60t1mjs8FHSVL3B7nP434AyML7gdkssXDkxzm8RFHNByR0SiBMIgiIgIiICYREBEQDdFSoRTzREIilBCnCdEQFClQgYRTlQiiJhEQTkiFAU4UIgIiICIgQEQpzQEREUTmiYygIiIgiIgImEQEREDCYyilBCKeQUIJKhERRERAREQERFEOaJyTKqiFChQMphEQAiIEBOac0ygInVEDOUwnJEBB4oiAinkoQEUoghSiYQRlQpwoUE8kUKUBFHVSEBETkiCIiojKInkgIiICIpRUHdSFGVKAiIogiIqCBSAiCMqQVHJEURFICCBugClRyRBERFEREBERRBERAWN1Fp6g1TaZbVco3SUspBcGuwcjluskgVL58Pjt99G2yVcTjabrXUUv4IlcXsXxHWWhL7oGvFJdmO4JMmGoY4mOUeR8fJdoYytW7TtKwav0ZX297GmdkZmpnY3ZI0ZGFrHKx5OfpccsfyzVcYyveT/CP+kVS17wPjv+kVQHOPxhg9R4FVELo+WGR5/Df9Io17x/tH/SKgoeSipc97vw3/SK3Ts77L9Q6+ldJRZp6GN3DJVzOIYD4DxK1axW2S83ijtsXx6qZsQ8sldw2OyUmm7NR2ihjbHT0kYjaAOZ6n2kqZZaenp+D4l8+ny+1ejZpymjb907jX18v4Qa8sb8y+pWe00litlPbaJhZTU7eCNpOSAvYEK57t9vpYceOHywKInkjoInREROUUIgkqFPRQUVIRQh2QEU+ahEDnhPDjONs+K+La11T2v2KKacWykjpGk/fqRneFrc7E9eS+08lbI3PnzHim9MZ4XKal046unalrO7Z+E6grOE/gxu4QtXq7lWVby6pq6icnmZJCV9O7ftFU2l9Sw3GgibFSXRrpDG0YDJWkcWPbkH518nfuV1j43JMsc7jlUOIPRQG5RAcKst57Fm47TLH+cf9ldh5ySuPexV2e0yyflv+yuwup9q55PpdF8lMqUUc1l7UoiIgiIgJyQc1PVFQilQiHRSDhQiApUBEEoijkgnCc0TkgckROqAoKlMooiIiChEQDuiId0BE6IimECIglQiIhlCNkTkinJEBTqgFEKDkgJyRMICIiIIpRAUIgKCUTKgoodkToiAiIiCIiKIURQERFQyiIEDkilRnogIiDmgIURA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
\.


--
-- Data for Name: perizinan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.perizinan (id, santri_id, tanggal, alasan, jam_keluar, jam_kembali, status, catatan, created_at, tujuan, tanggal_kembali, target_jam_kembali, petugas) FROM stdin;
6	1	2026-05-29	Belanja	14:43:00	14:44:30.556851	kembali		2026-05-29 14:44:05.045938	Cilimus	2026-05-29	\N	\N
7	1	2026-05-29	Belanja	16:29:00	16:47:40.002791	kembali		2026-05-29 16:29:30.75396	Kuningan	2026-05-29	\N	\N
8	1	2026-06-09	Belanja	19:26:00	19:27:02.230798	kembali		2026-06-09 19:26:53.936679	Kuningan	2026-06-09	\N	\N
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, key, label, grup, created_at) FROM stdin;
1	dashboard.view	Lihat Dashboard	dashboard	2026-06-11 15:40:06.023359
2	santri.view	Lihat Santri	santri	2026-06-11 15:40:06.023359
3	santri.create	Tambah Santri	santri	2026-06-11 15:40:06.023359
4	santri.update	Ubah Santri	santri	2026-06-11 15:40:06.023359
5	santri.delete	Hapus Santri	santri	2026-06-11 15:40:06.023359
6	kelas.view	Lihat Kelas	kelas	2026-06-11 15:40:06.023359
7	kelas.manage	Kelola Kelas	kelas	2026-06-11 15:40:06.023359
8	wali.view	Lihat Wali	wali	2026-06-11 15:40:06.023359
9	wali.manage	Kelola Wali	wali	2026-06-11 15:40:06.023359
10	guru.view	Lihat Guru	guru	2026-06-11 15:40:06.023359
11	guru.create	Tambah Guru	guru	2026-06-11 15:40:06.023359
12	guru.update	Ubah Guru	guru	2026-06-11 15:40:06.023359
13	guru.delete	Hapus Guru	guru	2026-06-11 15:40:06.023359
14	absensi.view	Lihat Absensi	absensi	2026-06-11 15:40:06.023359
15	absensi.create	Isi Absensi	absensi	2026-06-11 15:40:06.023359
16	absensi.update	Ubah Absensi	absensi	2026-06-11 15:40:06.023359
17	absensi_guru.view	Lihat Absensi Guru	absensi_guru	2026-06-11 15:40:06.023359
18	absensi_guru.manage	Kelola Absensi Guru	absensi_guru	2026-06-11 15:40:06.023359
19	hafalan.view	Lihat Hafalan	hafalan	2026-06-11 15:40:06.023359
20	hafalan.manage	Kelola Hafalan	hafalan	2026-06-11 15:40:06.023359
21	nilai.view	Lihat Nilai	nilai	2026-06-11 15:40:06.023359
22	nilai.manage	Kelola Nilai	nilai	2026-06-11 15:40:06.023359
23	tagihan.view	Lihat Tagihan	tagihan	2026-06-11 15:40:06.023359
24	tagihan.create	Tambah Tagihan	tagihan	2026-06-11 15:40:06.023359
25	tagihan.update	Ubah Tagihan	tagihan	2026-06-11 15:40:06.023359
26	tagihan.delete	Hapus Tagihan	tagihan	2026-06-11 15:40:06.023359
27	pembayaran.view	Lihat Pembayaran	pembayaran	2026-06-11 15:40:06.023359
28	pembayaran.manage	Kelola Pembayaran	pembayaran	2026-06-11 15:40:06.023359
29	bukukas.view	Lihat Buku Kas	bukukas	2026-06-11 15:40:06.023359
30	bukukas.manage	Kelola Buku Kas	bukukas	2026-06-11 15:40:06.023359
31	sahriyah.view	Lihat Sahriyah	sahriyah	2026-06-11 15:40:06.023359
32	sahriyah.manage	Kelola Sahriyah	sahriyah	2026-06-11 15:40:06.023359
33	pelanggaran.view	Lihat Pelanggaran	pelanggaran	2026-06-11 15:40:06.023359
34	pelanggaran.create	Tambah Pelanggaran	pelanggaran	2026-06-11 15:40:06.023359
35	pelanggaran.update	Ubah Pelanggaran	pelanggaran	2026-06-11 15:40:06.023359
36	perizinan.view	Lihat Perizinan	perizinan	2026-06-11 15:40:06.023359
37	perizinan.create	Tambah Perizinan	perizinan	2026-06-11 15:40:06.023359
38	perizinan.update	Ubah Perizinan	perizinan	2026-06-11 15:40:06.023359
39	tamu.view	Lihat Tamu	tamu	2026-06-11 15:40:06.023359
40	tamu.manage	Kelola Tamu	tamu	2026-06-11 15:40:06.023359
41	pengumuman.view	Lihat Pengumuman	pengumuman	2026-06-11 15:40:06.023359
42	pengumuman.manage	Kelola Pengumuman	pengumuman	2026-06-11 15:40:06.023359
43	profil.view	Lihat Profil Pesantren	profil	2026-06-11 15:40:06.023359
44	profil.manage	Kelola Profil Pesantren	profil	2026-06-11 15:40:06.023359
45	rfid.view	Lihat RFID	rfid	2026-06-11 15:40:06.023359
46	rfid.manage	Kelola RFID	rfid	2026-06-11 15:40:06.023359
47	audit.view	Lihat Audit	audit	2026-06-11 15:40:06.023359
48	device.view	Lihat Perangkat	device	2026-06-11 15:40:06.023359
49	device.manage	Kelola Perangkat	device	2026-06-11 15:40:06.023359
50	user.view	Lihat User	user	2026-06-11 15:40:06.023359
51	user.create	Tambah User	user	2026-06-11 15:40:06.023359
52	user.update	Ubah User	user	2026-06-11 15:40:06.023359
53	user.delete	Hapus User	user	2026-06-11 15:40:06.023359
54	role.manage	Kelola Role & Hak Akses	role	2026-06-11 15:40:06.023359
55	kesehatan.view	Lihat Kesehatan Santri	kesehatan	2026-06-14 21:28:24.830168
56	kesehatan.manage	Kelola Kesehatan Santri	kesehatan	2026-06-14 21:28:24.830168
\.


--
-- Data for Name: profil_pesantren; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profil_pesantren (id, nama_pesantren, alamat, telepon, email, website, logo_url, visi, misi, updated_at, banner_url, banner_active, splash_logo_url, app_icon_url, tagline, tentang) FROM stdin;
1	Anwarul Huda	Pakembangan,Mandirancan,Kuningan	0812345	kajenfla@nmkd	\N	/uploads/pesantren/1781402274537-59efe03913e551a0.png	Menjaga Amanah Kita Bersama	Pengadaan dan pelayanan Kliksantri	2026-06-15 12:53:36.063382	/uploads/pesantren/1781402352562-650191798cdb9feb.jpeg	t	/uploads/pesantren/1781502799518-defb0ce4716a64b6.png	/uploads/pesantren/1781502805620-a22ee96b6a1e730f.png	Amanah Kita Bersama	\N
\.


--
-- Data for Name: rfid_limit_override; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rfid_limit_override (id, transaction_uuid, santri_id, operator_id, limit_harian, total_hari_ini, nominal, alasan, created_at) FROM stdin;
\.


--
-- Data for Name: rfid_limit_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rfid_limit_settings (id, santri_id, daily_limit, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rfid_override_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rfid_override_logs (id, trx_uuid, santri_id, operator_id, limit_harian, total_harian, nominal, alasan, created_at) FROM stdin;
\.


--
-- Data for Name: rfid_sync_queue; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rfid_sync_queue (id, trx_uuid, device_id, sync_status, retry_count, last_error, created_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
1	1
1	2
1	3
1	4
1	5
1	6
1	7
1	8
1	9
1	10
1	11
1	12
1	13
1	14
1	15
1	16
1	17
1	18
1	19
1	20
1	21
1	22
1	23
1	24
1	25
1	26
1	27
1	28
1	29
1	30
1	31
1	32
1	33
1	34
1	35
1	36
1	37
1	38
1	39
1	40
1	41
1	42
1	43
1	44
1	45
1	46
1	47
1	48
1	49
1	50
1	51
1	52
1	53
1	54
3	1
3	23
3	24
3	25
3	26
3	27
3	28
3	29
3	30
3	31
3	32
3	45
3	46
3	47
4	1
4	33
4	34
4	35
4	36
4	37
4	38
4	39
4	40
5	1
5	2
5	3
5	4
5	5
5	6
5	7
5	8
5	9
5	41
5	42
5	43
5	44
2	1
2	6
2	7
2	10
2	11
2	12
2	14
2	15
2	16
2	17
2	18
2	19
2	20
2	21
2	22
4	55
4	56
2	55
5	55
1	55
1	56
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, label, is_system, created_at) FROM stdin;
1	superadmin	Super Admin	t	2026-06-11 15:40:06.023359
2	pendidikan	Pendidikan	t	2026-06-11 15:40:06.023359
3	keuangan	Keuangan	t	2026-06-11 15:40:06.023359
4	keamanan	Keamanan	t	2026-06-11 15:40:06.023359
5	sekretaris	Sekretaris	t	2026-06-11 15:40:06.023359
\.


--
-- Data for Name: sahriyah_setting; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sahriyah_setting (id, santri_id, nominal_uang, nominal_beras, keterangan, created_at) FROM stdin;
2	12	250000	10.00	Uang + Beras	2026-05-31 11:11:58.229474
3	13	250000	10.00	Uang + Beras	2026-05-31 11:11:58.229474
1	1	400000	0.00	Uang	2026-05-30 20:04:46.422423
\.


--
-- Data for Name: santri; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.santri (id, nis, nama, foto, uid_rfid, kelas_id, alamat, orang_tua, nomor_hp_ortu, status, saldo, limit_harian, created_at, wali_id) FROM stdin;
13	2026003	Abdillah hilhad		352721e0	1	Kuningan	Saeful Anwar	081218789313	aktif	95000	0	2026-05-31 11:08:21.712039	\N
1	2026001	Raihana Inarotur R		d13ef206	4	Kuningan	Saeful Anwar	081218789313	aktif	107000	50000	2026-05-26 13:30:59.472282	1
12	2026002	Ahmad As'ad		fadbace4	6	Kuningan	Saeful Anwar	081218789313	aktif	142000	0	2026-05-31 11:07:39.241831	\N
\.


--
-- Data for Name: tagihan_sahriyah; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tagihan_sahriyah (id, santri_id, bulan, tahun, nominal, status, tanggal_bayar, petugas, created_at, nominal_beras, keterangan, total_bayar, sisa_tagihan, beras_terbayar, sisa_beras) FROM stdin;
26	12	5	2026	250000	Belum Lunas	\N	\N	2026-06-02 14:39:56.066525	10.00	Uang + Beras	0	0	0.00	0.00
27	13	5	2026	250000	Belum Lunas	\N	\N	2026-06-02 14:39:56.068676	10.00	Uang + Beras	0	0	0.00	0.00
25	1	5	2026	250000	Cicilan	\N	Aiky	2026-06-02 14:39:56.060691	10.00	Uang + Beras	125000	125000	5.00	5.00
22	1	6	2026	250000	Lunas	2026-06-09	Aiky	2026-06-02 13:55:13.95045	10.00	Uang + Beras	250000	0	10.00	0.00
23	12	6	2026	250000	Lunas	2026-06-09	Aiky	2026-06-02 13:55:13.955867	10.00	Uang + Beras	250000	0	10.00	0.00
24	13	6	2026	250000	Lunas	2026-06-09	Aiky	2026-06-02 13:55:13.957892	10.00	Uang + Beras	250000	0	10.00	0.00
\.


--
-- Data for Name: tamu; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tamu (id, tanggal, jam_masuk, jam_keluar, nama_tamu, no_hp, alamat, instansi, tujuan, bertemu_dengan, keperluan, jumlah_orang, status, petugas, created_at) FROM stdin;
2	2026-06-02	19:33:47.734016	20:01:00.870439	Hamidah	123456789	kp.salam , Karangjaya, Pedes, Karawang	Wali	Besuk	Raihana	Besuk	3	Keluar	Aiky	2026-06-02 19:33:47.734016
\.


--
-- Data for Name: transaksi; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transaksi (id, santri_id, jenis, nominal, keterangan, created_by, created_at, trx_id) FROM stdin;
1	1	pembayaran	1000	Pembayaran RFID	1	2026-05-22 05:03:06.365917	\N
2	1	pembayaran	1000	Pembayaran RFID	1	2026-05-22 05:03:56.017108	\N
3	1	pembayaran	1000	Pembayaran RFID	1	2026-05-22 05:13:40.691085	\N
4	1	pembayaran	1000	Pembayaran RFID	1	2026-05-22 05:15:36.741943	\N
5	1	pembayaran	1	Pembayaran RFID	1	2026-05-22 05:17:45.518688	\N
6	1	pembayaran	1000	Pembayaran RFID	1	2026-05-22 07:16:25.367886	\N
7	1	pembayaran	100	Pembayaran RFID	1	2026-05-22 07:18:38.015789	\N
8	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 16:43:52.404986	\N
9	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 16:44:05.773522	\N
10	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 16:44:15.753589	\N
11	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 16:44:22.628153	\N
12	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 16:44:29.92383	\N
13	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 16:44:35.72183	\N
14	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 16:44:41.248642	\N
15	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 16:47:48.026345	\N
16	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 16:54:59.013549	\N
17	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 17:15:35.53895	\N
18	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 17:15:40.032357	\N
19	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 17:15:45.341213	\N
20	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 17:16:21.319375	\N
21	1	pembayaran	1000	Pembayaran RFID	1	2026-05-22 17:28:12.149027	\N
22	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 17:28:34.517266	\N
23	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 17:28:55.223104	\N
24	1	pembayaran	99	Pembayaran RFID	1	2026-05-22 17:29:04.524473	\N
25	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 17:30:11.134417	\N
26	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 17:37:38.555069	\N
27	1	pembayaran	0	Pembayaran RFID	1	2026-05-22 18:10:01.188122	\N
28	1	pembayaran	1000	Transaksi RFID	\N	2026-05-23 07:38:56.737662	\N
29	1	pembayaran	1000	Transaksi RFID	\N	2026-05-23 07:39:23.067755	\N
30	1	pembayaran	1000	Transaksi RFID	\N	2026-05-23 07:41:56.735112	\N
31	1	pembayaran	0	Transaksi RFID	\N	2026-05-23 07:42:31.105891	\N
32	1	pembayaran	1000	Transaksi RFID	\N	2026-05-23 07:43:28.587721	\N
33	1	pembayaran	1000	Transaksi RFID	\N	2026-05-23 09:13:33.983291	\N
34	1	pembayaran	500	Transaksi RFID	\N	2026-05-23 09:13:52.706758	\N
35	1	pembayaran	500	Transaksi RFID	\N	2026-05-23 09:14:24.50389	\N
36	1	pembayaran	1000	Transaksi RFID	\N	2026-05-23 09:14:51.991595	\N
37	1	pembayaran	1000	Transaksi RFID	\N	2026-05-23 09:21:11.298861	\N
38	1	pembayaran	1000	Transaksi RFID	\N	2026-05-23 09:31:54.907018	\N
39	1	topup	500	Topup RFID	\N	2026-05-23 09:38:42.328868	\N
40	1	topup	500	Topup RFID	\N	2026-05-23 09:38:55.024204	\N
41	1	pembayaran	500	Transaksi RFID	\N	2026-05-23 10:06:46.710804	\N
42	1	topup	500	Topup RFID	\N	2026-05-23 10:07:15.887972	\N
43	1	pembayaran	500	Transaksi RFID	\N	2026-05-23 10:26:14.897019	\N
44	1	topup	500	Topup RFID	\N	2026-05-23 10:26:43.843942	\N
45	1	pembayaran	500	Transaksi RFID	\N	2026-05-23 10:37:56.745226	\N
46	1	topup	500	Topup RFID	\N	2026-05-23 10:38:25.194373	\N
47	1	pembayaran	2000	Transaksi RFID	\N	2026-05-23 10:51:27.487883	\N
48	1	topup	2000	Topup RFID	\N	2026-05-23 10:51:48.937416	\N
49	1	pembayaran	5000	Transaksi RFID	\N	2026-05-23 11:10:08.724611	\N
50	1	topup	5000	Topup RFID	\N	2026-05-23 11:10:39.127414	\N
51	1	topup	15000	Topup RFID	\N	2026-05-23 14:21:27.612772	\N
52	1	topup	5000	Topup RFID	\N	2026-05-23 14:22:36.430882	\N
53	1	pembayaran	5000	Transaksi RFID	\N	2026-05-23 14:23:03.152187	\N
54	1	pembayaran	5000	Transaksi RFID	\N	2026-05-23 14:24:10.432806	\N
55	1	pembayaran	2000	Transaksi RFID	\N	2026-05-23 14:24:35.925781	\N
56	1	pembayaran	500	Transaksi RFID	\N	2026-05-23 14:25:14.730434	\N
57	1	pembayaran	8000	Transaksi RFID	\N	2026-05-23 14:26:44.045312	\N
58	1	pembayaran	500	Transaksi RFID	\N	2026-05-23 15:29:06.294916	\N
59	1	pembayaran	10000	Transaksi RFID	\N	2026-05-23 15:29:49.969788	\N
60	1	pembayaran	10000	Transaksi RFID	\N	2026-05-23 15:30:05.345589	\N
61	1	topup	100000	Topup RFID	\N	2026-05-23 15:41:04.16309	\N
62	1	pembayaran	14000	Transaksi RFID	\N	2026-05-23 15:41:49.689264	\N
63	1	pembayaran	0	Transaksi RFID	\N	2026-05-23 15:42:02.640266	\N
64	1	pembayaran	100	Transaksi RFID	\N	2026-05-24 04:56:04.452395	\N
65	1	topup	100	Topup RFID	\N	2026-05-24 04:56:44.578862	\N
66	1	pembayaran	100	Transaksi RFID	\N	2026-05-24 14:14:15.943512	\N
67	1	topup	100	Topup RFID	\N	2026-05-24 14:15:25.956474	\N
68	1	pembayaran	50000	Transaksi RFID	\N	2026-05-24 15:44:15.494675	\N
69	1	topup	50000	Topup RFID	\N	2026-05-24 15:44:46.981753	\N
70	1	pembayaran	1000	Transaksi RFID	\N	2026-05-24 15:57:28.046736	\N
71	1	topup	1000	Topup RFID	\N	2026-05-24 15:57:52.994825	\N
72	1	topup	10000	Topup RFID	\N	2026-05-24 19:08:47.214618	\N
73	1	topup	10000	Topup RFID	\N	2026-05-24 19:11:11.745238	\N
74	1	topup	30000	Topup RFID	\N	2026-05-24 19:25:21.898566	\N
75	1	topup	10000	Topup RFID	\N	2026-05-24 20:38:31.868077	EDC01-3416566
76	1	pembayaran	1000	Transaksi RFID	\N	2026-05-25 04:34:31.401995	EDC01-119751
77	1	pembayaran	1000	Transaksi RFID	\N	2026-05-25 07:48:10.168004	EDC01-66299
78	1	pembayaran	1000	Transaksi RFID	\N	2026-05-25 09:52:46.504763	EDC01-1594595
79	1	pembayaran	500	Transaksi RFID	\N	2026-05-25 11:12:06.118844	EDC01-68275
80	1	topup	3500	Topup RFID	\N	2026-05-25 11:40:45.231102	EDC01-137407
81	1	pembayaran	9500	Transaksi RFID	\N	2026-05-25 11:42:31.786803	EDC01-244599
82	1	topup	4500	Topup RFID	\N	2026-05-25 11:43:39.001885	EDC01-315877
83	1	RFID	5000	Pembayaran RFID	\N	2026-06-03 09:32:54.674171	TEST-001
84	1	RFID	5000	Pembayaran RFID	\N	2026-06-03 09:55:16.35371	TEST-002
88	1	TOPUP RFID	10000	Topup Saldo RFID	1	2026-06-03 16:20:40.300571	TOPUP-1780478440306
89	1	TOPUP RFID	10000	Topup Saldo RFID	1	2026-06-03 16:32:15.041434	TOPUP-1780479135049
122	13	topup	100000	Topup RFID	\N	2026-06-04 13:12:33.238338	EDC01-5674917
123	12	topup	150000	Topup RFID	\N	2026-06-04 13:12:56.87545	EDC01-5698480
124	12	pembayaran	1000	Transaksi RFID	\N	2026-06-04 13:36:06.8221	EDC01-7088771
125	12	pembayaran	2500	Transaksi RFID	\N	2026-06-04 13:37:03.790752	EDC01-7145523
126	1	pembayaran	2000	Transaksi RFID	\N	2026-06-04 13:39:14.969697	EDC01-7276711
127	12	pembayaran	2500	Transaksi RFID	\N	2026-06-04 14:45:11.409632	EDC01-30545
128	12	TOPUP RFID	1000	Topup Saldo RFID	1	2026-06-04 14:46:39.036486	TOPUP-1780559199037
129	13	TOPUP RFID	1000	Topup Saldo RFID	1	2026-06-04 14:46:50.403556	TOPUP-1780559210404
130	12	pembayaran	500	Transaksi RFID	\N	2026-06-04 14:47:18.583439	EDC01-157470
131	13	pembayaran	5000	Transaksi RFID	\N	2026-06-04 15:14:04.395562	EDC01-1763599
132	13	pembayaran	500	Transaksi RFID	\N	2026-06-04 15:32:21.659963	EDC01-2860648
133	1	pembayaran	500	Transaksi RFID	\N	2026-06-04 15:32:46.457484	EDC01-2885682
134	12	pembayaran	500	Transaksi RFID	\N	2026-06-04 16:12:08.290036	EDC01-275256
135	12	pembayaran	500	Transaksi RFID	\N	2026-06-04 16:15:40.783741	EDC01-490932
136	12	pembayaran	500	Transaksi RFID	\N	2026-06-04 16:17:18.525484	EDC01-588416
137	12	pembayaran	500	Transaksi RFID	\N	2026-06-04 16:49:20.303875	EDC01-2510424
138	13	pembayaran	500	Transaksi RFID	\N	2026-06-04 16:53:41.259785	EDC01-2771448
139	1	pembayaran	500	Transaksi RFID	\N	2026-06-04 16:54:10.919926	EDC01-2801132
140	12	topup	500	Topup RFID	\N	2026-06-04 16:54:51.874974	EDC01-2841902
\.


--
-- Data for Name: transaksi_rfid; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transaksi_rfid (id, trx_uuid, trx_id, santri_id, merchant_id, device_id, nominal, saldo_awal, saldo_akhir, is_override, sync_status, created_at, trx_type) FROM stdin;
1	8b5ebe5e-88fd-4e1f-9c6d-272d120e693f	TEST-001	1	\N	3	5000	100000	95000	f	synced	2026-06-03 09:32:54.674171	payment
2	5db2471f-c173-4951-b00d-7491126cb3de	TEST-002	1	\N	3	5000	95000	90000	f	synced	2026-06-03 09:55:16.35371	payment
3	bd71a20d-bde0-4522-9850-0f81e524142e	SYNC001	1	1	2051	2000	90000	88000	f	synced	2026-06-03 13:24:48.837422	payment
4	e526fd3d-0ba3-4f72-88ed-67eaf66a4573	SYNC002	1	1	2051	3000	88000	85000	f	synced	2026-06-03 13:24:48.845112	payment
5	639b425d-2d9a-4248-b713-a5391cb79c0e	SYNC003	1	1	2051	1000	85000	84000	f	synced	2026-06-03 14:23:31.303443	payment
6	f75f4eff-068e-4813-903b-5631d14dd690	REFUND-1780555422803	1	\N	3	5000	102000	107000	f	synced	2026-06-04 13:43:42.802676	refund
7	5521f30b-37e0-4a8e-84d3-03cc321a05b6	REFUND-1780557056503	1	1	2051	1000	107000	108000	f	synced	2026-06-04 14:10:56.499306	refund
8	851a0f09-e1df-4922-a1ff-6694e90e1bc2	TOPUP-1780559199037	12	\N	\N	1000	144000	145000	f	synced	2026-06-04 14:46:39.036486	topup
9	aab3d54e-993e-452d-afc6-ec9ba780dc2d	TOPUP-1780559210404	13	\N	\N	1000	100000	101000	f	synced	2026-06-04 14:46:50.403556	topup
10	5e39c96e-c512-4ce2-b2d8-a8f95473b091	EDC01-2510424	12	\N	3	500	142000	141500	f	synced	2026-06-04 16:49:20.297957	payment
11	73c333a2-1ed4-49e6-a13e-edbfcc6da2e1	EDC01-2771448	13	\N	3	500	95500	95000	f	synced	2026-06-04 16:53:41.255748	payment
12	e61921c7-22c6-4812-9d5b-3cb6fd812d8a	EDC01-2801132	1	\N	3	500	107500	107000	f	synced	2026-06-04 16:54:10.917298	payment
13	2fe884ec-cf79-44d4-b1a7-7cfa420c1f1c	EDC01-2841902	12	\N	3	500	141500	142000	f	synced	2026-06-04 16:54:51.869548	topup
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, nama, username, password, role, created_at, status) FROM stdin;
5	Admin Sekretaris	sekretaris	123456	sekretaris	2026-05-26 18:49:05.603415	Aktif
1	Super Admin	admin	admin123	superadmin	2026-05-21 10:56:28.959138	Aktif
7	Admin Pendidikan	pendidikan	123456	pendidikan	2026-05-28 10:05:40.756521	Aktif
8	Admin Keamanan	keamanan	123456	keamanan	2026-05-28 10:16:58.059494	Aktif
9	Admin Keuangan	keuangan	123456	keuangan	2026-05-28 13:32:21.209255	Aktif
\.


--
-- Data for Name: wali_akun; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wali_akun (id, nomor_hp, pin_hash, nama, status, must_change_pin, failed_attempts, locked_until, last_login, created_at, updated_at) FROM stdin;
1	08123456789	$2b$10$KT5RHfCe69CG7/2mcaVH6.Xj/QUMGVbfc4tYN/DbSX.fKzp2mQoGW	Wali Contoh Dev	active	f	0	\N	2026-06-14 13:18:06.290209	2026-06-05 00:50:45.285936	2026-06-14 13:18:06.290209
2	085215914881	$2a$10$vy6NvCTipfivbS/rWXApo.WR/Vb3.a6TgU2cNeaIt7mOkuSXRr3c2	Ecin K	active	t	0	\N	2026-06-15 12:35:27.341514	2026-06-11 13:55:54.599353	2026-06-15 12:35:27.341514
\.


--
-- Data for Name: wali_app_audit; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wali_app_audit (id, nomor_hp, event, ip_address, user_agent, created_at) FROM stdin;
1	628123456789	login_success	::ffff:127.0.0.1	Thunder Client (https://www.thunderclient.com)	2026-06-05 00:55:00.184328
2	628123456789	login_success	::ffff:127.0.0.1	Thunder Client (https://www.thunderclient.com)	2026-06-08 16:26:43.141904
3	6281218789313	login_failed	::ffff:127.0.0.1	Thunder Client (https://www.thunderclient.com)	2026-06-08 16:31:31.369197
4	6281218789313	login_failed	::ffff:127.0.0.1	Thunder Client (https://www.thunderclient.com)	2026-06-08 16:31:36.965295
5	628123456789	login_success	::ffff:127.0.0.1	Thunder Client (https://www.thunderclient.com)	2026-06-08 16:41:45.090804
6	628123456789	login_success	::ffff:127.0.0.1	Thunder Client (https://www.thunderclient.com)	2026-06-08 16:46:05.003197
7	628123456789	login_success	::ffff:10.117.145.215	okhttp/4.12.0	2026-06-08 17:20:12.286408
8	628123456789	login_success	::ffff:127.0.0.1	Thunder Client (https://www.thunderclient.com)	2026-06-08 17:24:37.489366
9	628123456789	login_success	::ffff:127.0.0.1	Thunder Client (https://www.thunderclient.com)	2026-06-08 17:34:50.880142
10	628123456789	login_success	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 10:41:59.48596
11	628123456789	PIN_CHANGED	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 11:49:09.416641
12	6285215914881	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 11:54:50.52385
13	6285215914881	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 11:54:54.792015
14	6285215914881	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 11:54:55.980854
15	6285215914881	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 13:39:24.066117
16	6285215914881	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 13:39:28.023035
17	6285215914881	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 13:39:28.962791
18	6285215914881	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 13:39:37.258166
19	6285215914881	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 13:39:38.479476
20	6285215914881	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 13:39:46.184961
21	6285215914881	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 13:46:30.50522
22	085215914881	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 14:07:50.340513
23	085215914881	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 14:07:53.810503
24	085215914881	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 14:07:54.740958
25	085215914881	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 14:07:55.98748
26	08123456789	login_success	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 18:56:31.806486
27	085215914881	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 18:57:17.237521
28	085215914881	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 18:57:18.631642
29	08123456789	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 19:05:32.47059
30	08123456789	login_success	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 19:05:37.85328
31	085215914881	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-09 23:51:39.77831
32	08123456789	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-10 09:56:35.153726
33	08123456789	login_failed	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-10 09:56:43.498189
34	08123456789	login_success	::ffff:10.157.249.245	okhttp/4.12.0	2026-06-10 09:56:50.411817
35	08123456789	login_success	::ffff:10.161.70.213	okhttp/4.12.0	2026-06-11 14:40:30.395591
36	085215914881	login_success	::ffff:10.161.70.213	okhttp/4.12.0	2026-06-11 14:40:50.387525
37	085215914881	login_success	::ffff:10.161.70.213	okhttp/4.12.0	2026-06-13 04:08:39.022052
38	08123456789	login_success	::ffff:10.161.70.213	okhttp/4.12.0	2026-06-13 04:21:44.723759
39	08123456789	login_success	::ffff:10.161.70.213	okhttp/4.12.0	2026-06-13 04:53:31.371288
40	085215914881	login_success	::ffff:10.161.70.213	okhttp/4.12.0	2026-06-13 05:24:49.177506
41	08123456789	login_success	::ffff:10.160.153.29	okhttp/4.12.0	2026-06-14 13:18:06.37928
42	085215914881	login_success	::ffff:10.160.153.29	okhttp/4.12.0	2026-06-15 12:35:27.384337
\.


--
-- Data for Name: wali_santri; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wali_santri (id, nama, nomor_hp, alamat, created_at, santri_id) FROM stdin;
2	Ecin K	085215914881	Kuningan	2026-06-09 11:06:42.243721	13
1	Saeful Anwar	08123456789	Kuningan	2026-05-28 06:43:57.856291	1
3	Saeful Anwar	08123456789	Kuningan	2026-06-09 11:24:40.265628	12
\.


--
-- Name: absensi_guru_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.absensi_guru_id_seq', 6, true);


--
-- Name: absensi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.absensi_id_seq', 21, true);


--
-- Name: absensi_santri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.absensi_santri_id_seq', 8, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 694, true);


--
-- Name: buku_kas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.buku_kas_id_seq', 141, true);


--
-- Name: devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.devices_id_seq', 2051, true);


--
-- Name: guru_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.guru_id_seq', 3, true);


--
-- Name: hafalan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hafalan_id_seq', 7, true);


--
-- Name: jenis_tagihan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.jenis_tagihan_id_seq', 4, true);


--
-- Name: kelas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kelas_id_seq', 12, true);


--
-- Name: kesehatan_santri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kesehatan_santri_id_seq', 1, true);


--
-- Name: merchant_rfid_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.merchant_rfid_id_seq', 1, true);


--
-- Name: nilai_mingguan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.nilai_mingguan_id_seq', 8, true);


--
-- Name: pelanggaran_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pelanggaran_id_seq', 11, true);


--
-- Name: pembayaran_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pembayaran_detail_id_seq', 22, true);


--
-- Name: pembayaran_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pembayaran_id_seq', 17, true);


--
-- Name: pembayaran_sahriyah_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pembayaran_sahriyah_id_seq', 71, true);


--
-- Name: pengumuman_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pengumuman_id_seq', 4, true);


--
-- Name: perizinan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.perizinan_id_seq', 8, true);


--
-- Name: permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.permissions_id_seq', 56, true);


--
-- Name: profil_pesantren_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.profil_pesantren_id_seq', 1, false);


--
-- Name: rfid_limit_override_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rfid_limit_override_id_seq', 1, false);


--
-- Name: rfid_limit_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rfid_limit_settings_id_seq', 1, false);


--
-- Name: rfid_override_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rfid_override_logs_id_seq', 1, false);


--
-- Name: rfid_sync_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rfid_sync_queue_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 5, true);


--
-- Name: sahriyah_setting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sahriyah_setting_id_seq', 3, true);


--
-- Name: santri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.santri_id_seq', 13, true);


--
-- Name: tagihan_sahriyah_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tagihan_sahriyah_id_seq', 27, true);


--
-- Name: tamu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tamu_id_seq', 2, true);


--
-- Name: transaksi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transaksi_id_seq', 140, true);


--
-- Name: transaksi_rfid_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transaksi_rfid_id_seq', 13, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 9, true);


--
-- Name: wali_akun_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wali_akun_id_seq', 2, true);


--
-- Name: wali_app_audit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wali_app_audit_id_seq', 42, true);


--
-- Name: wali_santri_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wali_santri_id_seq', 3, true);


--
-- Name: absensi_guru absensi_guru_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absensi_guru
    ADD CONSTRAINT absensi_guru_pkey PRIMARY KEY (id);


--
-- Name: absensi_guru absensi_guru_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absensi_guru
    ADD CONSTRAINT absensi_guru_unique UNIQUE (guru_id, bulan, tahun);


--
-- Name: absensi absensi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absensi
    ADD CONSTRAINT absensi_pkey PRIMARY KEY (id);


--
-- Name: absensi_santri absensi_santri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absensi_santri
    ADD CONSTRAINT absensi_santri_pkey PRIMARY KEY (id);


--
-- Name: absensi absensi_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absensi
    ADD CONSTRAINT absensi_unique UNIQUE (santri_id, tanggal, sesi);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: buku_kas buku_kas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buku_kas
    ADD CONSTRAINT buku_kas_pkey PRIMARY KEY (id);


--
-- Name: devices devices_device_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_device_id_key UNIQUE (device_id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: guru guru_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guru
    ADD CONSTRAINT guru_pkey PRIMARY KEY (id);


--
-- Name: hafalan hafalan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hafalan
    ADD CONSTRAINT hafalan_pkey PRIMARY KEY (id);


--
-- Name: jenis_tagihan jenis_tagihan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jenis_tagihan
    ADD CONSTRAINT jenis_tagihan_pkey PRIMARY KEY (id);


--
-- Name: kelas kelas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kelas
    ADD CONSTRAINT kelas_pkey PRIMARY KEY (id);


--
-- Name: kesehatan_santri kesehatan_santri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kesehatan_santri
    ADD CONSTRAINT kesehatan_santri_pkey PRIMARY KEY (id);


--
-- Name: merchant_rfid merchant_rfid_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchant_rfid
    ADD CONSTRAINT merchant_rfid_pkey PRIMARY KEY (id);


--
-- Name: nilai_mingguan nilai_mingguan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nilai_mingguan
    ADD CONSTRAINT nilai_mingguan_pkey PRIMARY KEY (id);


--
-- Name: pelanggaran pelanggaran_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pelanggaran
    ADD CONSTRAINT pelanggaran_pkey PRIMARY KEY (id);


--
-- Name: pembayaran_detail pembayaran_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pembayaran_detail
    ADD CONSTRAINT pembayaran_detail_pkey PRIMARY KEY (id);


--
-- Name: pembayaran pembayaran_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pembayaran
    ADD CONSTRAINT pembayaran_pkey PRIMARY KEY (id);


--
-- Name: pembayaran_sahriyah pembayaran_sahriyah_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pembayaran_sahriyah
    ADD CONSTRAINT pembayaran_sahriyah_pkey PRIMARY KEY (id);


--
-- Name: pengumuman pengumuman_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pengumuman
    ADD CONSTRAINT pengumuman_pkey PRIMARY KEY (id);


--
-- Name: perizinan perizinan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perizinan
    ADD CONSTRAINT perizinan_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_key_key UNIQUE (key);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: profil_pesantren profil_pesantren_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profil_pesantren
    ADD CONSTRAINT profil_pesantren_pkey PRIMARY KEY (id);


--
-- Name: rfid_limit_override rfid_limit_override_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rfid_limit_override
    ADD CONSTRAINT rfid_limit_override_pkey PRIMARY KEY (id);


--
-- Name: rfid_limit_settings rfid_limit_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rfid_limit_settings
    ADD CONSTRAINT rfid_limit_settings_pkey PRIMARY KEY (id);


--
-- Name: rfid_limit_settings rfid_limit_settings_santri_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rfid_limit_settings
    ADD CONSTRAINT rfid_limit_settings_santri_id_key UNIQUE (santri_id);


--
-- Name: rfid_override_logs rfid_override_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rfid_override_logs
    ADD CONSTRAINT rfid_override_logs_pkey PRIMARY KEY (id);


--
-- Name: rfid_sync_queue rfid_sync_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rfid_sync_queue
    ADD CONSTRAINT rfid_sync_queue_pkey PRIMARY KEY (id);


--
-- Name: rfid_sync_queue rfid_sync_queue_trx_uuid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rfid_sync_queue
    ADD CONSTRAINT rfid_sync_queue_trx_uuid_key UNIQUE (trx_uuid);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sahriyah_setting sahriyah_setting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sahriyah_setting
    ADD CONSTRAINT sahriyah_setting_pkey PRIMARY KEY (id);


--
-- Name: sahriyah_setting sahriyah_setting_santri_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sahriyah_setting
    ADD CONSTRAINT sahriyah_setting_santri_id_key UNIQUE (santri_id);


--
-- Name: santri santri_nis_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.santri
    ADD CONSTRAINT santri_nis_key UNIQUE (nis);


--
-- Name: santri santri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.santri
    ADD CONSTRAINT santri_pkey PRIMARY KEY (id);


--
-- Name: santri santri_uid_rfid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.santri
    ADD CONSTRAINT santri_uid_rfid_key UNIQUE (uid_rfid);


--
-- Name: tagihan_sahriyah tagihan_sahriyah_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tagihan_sahriyah
    ADD CONSTRAINT tagihan_sahriyah_pkey PRIMARY KEY (id);


--
-- Name: tamu tamu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tamu
    ADD CONSTRAINT tamu_pkey PRIMARY KEY (id);


--
-- Name: transaksi transaksi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaksi
    ADD CONSTRAINT transaksi_pkey PRIMARY KEY (id);


--
-- Name: transaksi_rfid transaksi_rfid_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaksi_rfid
    ADD CONSTRAINT transaksi_rfid_pkey PRIMARY KEY (id);


--
-- Name: transaksi_rfid transaksi_rfid_trx_uuid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaksi_rfid
    ADD CONSTRAINT transaksi_rfid_trx_uuid_key UNIQUE (trx_uuid);


--
-- Name: transaksi transaksi_trx_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaksi
    ADD CONSTRAINT transaksi_trx_id_key UNIQUE (trx_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: wali_akun wali_akun_nomor_hp_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wali_akun
    ADD CONSTRAINT wali_akun_nomor_hp_key UNIQUE (nomor_hp);


--
-- Name: wali_akun wali_akun_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wali_akun
    ADD CONSTRAINT wali_akun_pkey PRIMARY KEY (id);


--
-- Name: wali_app_audit wali_app_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wali_app_audit
    ADD CONSTRAINT wali_app_audit_pkey PRIMARY KEY (id);


--
-- Name: wali_santri wali_santri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wali_santri
    ADD CONSTRAINT wali_santri_pkey PRIMARY KEY (id);


--
-- Name: idx_kesehatan_santri_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kesehatan_santri_created ON public.kesehatan_santri USING btree (created_at DESC);


--
-- Name: idx_kesehatan_santri_santri; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kesehatan_santri_santri ON public.kesehatan_santri USING btree (santri_id);


--
-- Name: idx_pengumuman_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pengumuman_active ON public.pengumuman USING btree (is_active, published_at DESC);


--
-- Name: idx_wali_akun_nomor_hp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wali_akun_nomor_hp ON public.wali_akun USING btree (nomor_hp);


--
-- Name: idx_wali_akun_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wali_akun_status ON public.wali_akun USING btree (status);


--
-- Name: idx_wali_app_audit_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wali_app_audit_event ON public.wali_app_audit USING btree (event, created_at DESC);


--
-- Name: idx_wali_app_audit_nomor_hp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wali_app_audit_nomor_hp ON public.wali_app_audit USING btree (nomor_hp, created_at DESC);


--
-- Name: absensi absensi_santri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absensi
    ADD CONSTRAINT absensi_santri_id_fkey FOREIGN KEY (santri_id) REFERENCES public.santri(id) ON DELETE CASCADE;


--
-- Name: absensi_santri absensi_santri_santri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absensi_santri
    ADD CONSTRAINT absensi_santri_santri_id_fkey FOREIGN KEY (santri_id) REFERENCES public.santri(id) ON DELETE CASCADE;


--
-- Name: santri fk_kelas; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.santri
    ADD CONSTRAINT fk_kelas FOREIGN KEY (kelas_id) REFERENCES public.kelas(id) ON DELETE SET NULL;


--
-- Name: hafalan hafalan_santri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hafalan
    ADD CONSTRAINT hafalan_santri_id_fkey FOREIGN KEY (santri_id) REFERENCES public.santri(id) ON DELETE CASCADE;


--
-- Name: kesehatan_santri kesehatan_santri_santri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kesehatan_santri
    ADD CONSTRAINT kesehatan_santri_santri_id_fkey FOREIGN KEY (santri_id) REFERENCES public.santri(id) ON DELETE CASCADE;


--
-- Name: nilai_mingguan nilai_mingguan_santri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nilai_mingguan
    ADD CONSTRAINT nilai_mingguan_santri_id_fkey FOREIGN KEY (santri_id) REFERENCES public.santri(id) ON DELETE CASCADE;


--
-- Name: pelanggaran pelanggaran_santri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pelanggaran
    ADD CONSTRAINT pelanggaran_santri_id_fkey FOREIGN KEY (santri_id) REFERENCES public.santri(id) ON DELETE CASCADE;


--
-- Name: pembayaran_detail pembayaran_detail_pembayaran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pembayaran_detail
    ADD CONSTRAINT pembayaran_detail_pembayaran_id_fkey FOREIGN KEY (pembayaran_id) REFERENCES public.pembayaran(id) ON DELETE CASCADE;


--
-- Name: pembayaran pembayaran_jenis_tagihan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pembayaran
    ADD CONSTRAINT pembayaran_jenis_tagihan_id_fkey FOREIGN KEY (jenis_tagihan_id) REFERENCES public.jenis_tagihan(id) ON DELETE CASCADE;


--
-- Name: pembayaran pembayaran_santri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pembayaran
    ADD CONSTRAINT pembayaran_santri_id_fkey FOREIGN KEY (santri_id) REFERENCES public.santri(id) ON DELETE CASCADE;


--
-- Name: perizinan perizinan_santri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perizinan
    ADD CONSTRAINT perizinan_santri_id_fkey FOREIGN KEY (santri_id) REFERENCES public.santri(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: santri santri_wali_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.santri
    ADD CONSTRAINT santri_wali_id_fkey FOREIGN KEY (wali_id) REFERENCES public.wali_santri(id);


--
-- Name: transaksi transaksi_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaksi
    ADD CONSTRAINT transaksi_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: wali_santri wali_santri_santri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wali_santri
    ADD CONSTRAINT wali_santri_santri_id_fkey FOREIGN KEY (santri_id) REFERENCES public.santri(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Sm0xXleJ6xRPdzDaJCKyaYa7WfDDzJE54TLv00IdRY4qyBLN2ZRoAPcq5rS8TQg

